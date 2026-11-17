import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Match Next.js precedence: .env.local overrides .env (dotenv never overrides already-set variables).
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Placeholder lets `prisma generate`/`validate` run without a database (e.g. in CI or on Vercel's build).
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/placeholder" },
});
