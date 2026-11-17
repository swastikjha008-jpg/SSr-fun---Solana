import { readFileSync } from "node:fs";
import path from "node:path";
import { AddressInfo } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { disconnectDb, getDb } from "@/lib/db";
import { resetEnvCache } from "@/lib/env";

const MIGRATION = path.resolve(__dirname, "../../prisma/migrations/20261115000000_init/migration.sql");

export interface TestDb {
  stop(): Promise<void>;
}

/** Starts an in-process real PostgreSQL (PGlite), applies the project's migration, and points the app at it. */
export async function startTestDb(): Promise<TestDb> {
  const pg = new PGlite();
  await pg.exec(readFileSync(MIGRATION, "utf8"));
  const server = new PGLiteSocketServer({ db: pg, port: 0, host: "127.0.0.1" });
  await server.start();
  const port = (server as unknown as { server: { address(): AddressInfo } }).server.address().port;
  process.env.DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable`;
  resetEnvCache();
  await disconnectDb();
  return {
    async stop() {
      await disconnectDb();
      await server.stop();
      await pg.close();
    },
  };
}

/** Clears domain data between tests; keeps admin, sessions and throttle rows. */
export async function resetDomainData() {
  const db = getDb();
  await db.auditLog.deleteMany();
  await db.betaFeedback.deleteMany();
  await db.campaignChecklist.deleteMany();
  await db.reserveProfile.deleteMany(); // cascades assets + thesis
}
