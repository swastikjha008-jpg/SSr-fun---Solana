/**
 * Zero-install local PostgreSQL for development and demos (PGlite, persisted in ./.pglite).
 * Applies the project migration on first run, then serves the Postgres wire protocol on 127.0.0.1:5433.
 * NOT for production: use a managed PostgreSQL (Neon, Supabase, Vercel Postgres, ...).
 *
 *   pnpm dev:db        # terminal 1
 *   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable" DB_POOL_MAX=1 pnpm dev   # terminal 2
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORT = Number(process.env.DEV_DB_PORT) || 5433;
const dir = path.resolve(process.cwd(), "prisma/migrations");

async function main() {
  const pg = new PGlite(path.resolve(process.cwd(), ".pglite"));
  const exists = await pg.query<{ t: string | null }>(`select to_regclass('"ReserveProfile"')::text as t`);
  if (!exists.rows[0]?.t) {
    for (const m of readdirSync(dir).filter((d) => /^\d+_/.test(d)).sort()) {
      await pg.exec(readFileSync(path.join(dir, m, "migration.sql"), "utf8"));
      console.log(`applied migration ${m}`);
    }
  }
  const server = new PGLiteSocketServer({ db: pg, port: PORT, host: "127.0.0.1" });
  await server.start();
  console.log(`\nLocal dev PostgreSQL ready:\n  DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres?sslmode=disable"\n  Also set DB_POOL_MAX=1 (PGlite serves one connection at a time).\n`);
  const stop = async () => {
    await server.stop();
    await pg.close();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
