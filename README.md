# SSR.FUN Beta Challenge Companion

A companion presentation site and owner console for the [SSR.FUN Beta Launch Challenge](https://superteam.fun/earn/listing/ssrfun-beta-launch-challenge) on Superteam Earn.

**Independent project. Not affiliated with SSR.FUN.** It presents the owner's own Reserve thesis, allocation and beta feedback. It does not trade, sign transactions, mint tokens, hold keys, or submit anything to SSR.FUN or Superteam Earn, and it invents no PnL, volume, prices or testing results. Everything shown is owner-entered and labelled by provenance; with no data it shows clearly-marked placeholders.

## What is in the box

| Part | Where |
|---|---|
| Landing page (hero with ASCII video background and EchoText, thesis, allocation chart, beta feedback, challenge facts) | `src/app/page.tsx`, `src/components` |
| Owner console at `/admin` (login, Reserve, allocation, thesis, feedback, checklist) | `src/app/admin`, `src/components/admin` |
| REST API `/api/v1/*` (public + admin), Zod validation, DB-backed sessions, audit log | `src/app/api`, `src/services`, `src/validation`, `src/lib` |
| Database schema + migration (PostgreSQL, Prisma 7) | `prisma/` |
| Tests (100): unit + integration against real PostgreSQL (PGlite) | `test/` |

Stack: Next.js 16, React 19, TypeScript (strict), Tailwind CSS 4, Recharts, Prisma 7, PostgreSQL, Zod, `@solana/web3.js` (read-only RPC lookup). Package manager: **pnpm**.

## Run locally (no Postgres install needed)

Requires Node >= 20.9 and pnpm 10 (`corepack enable`).

```bash
pnpm install
cp .env.example .env.local        # then edit (see below)
pnpm hash-password                # prints ADMIN_PASSWORD_HASH (escaped form for .env.local)

pnpm dev:db                       # terminal 1: local PostgreSQL on :5433, migration applied
pnpm dev                          # terminal 2: http://localhost:3000   (admin: /admin)
```

In `.env.local` for the local DB use:

```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable"
DB_POOL_MAX=1
```

`pnpm dev` without any env still renders the landing page with labelled placeholder content (the admin and API need the env). A **production** server (`pnpm start`) deliberately refuses to serve until all required env vars are valid; the log names each bad variable, never its value.

## Quality gates

```bash
pnpm check        # typecheck + lint + prisma validate + tests
pnpm build        # prisma generate + next build
```

CI (`.github/workflows/ci.yml`) runs the same on every push.

## Deploy

See [DEPLOY.md](./DEPLOY.md) (Vercel + Neon, about 10 minutes).

## Use it for the submission

1. Do the challenge steps on SSR.FUN, X and Superteam Earn yourself.
2. In `/admin`: create a Reserve profile, paste the **real** Reserve link from SSR.FUN, enter your real allocation and thesis, add your genuine beta observations, then publish.
3. The Checklist tab tracks your own progress. It is self-reported and verifies nothing.

Also see [API.md](./API.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Known limitations

- **No SSR.FUN integration.** No official API/SDK/program IDs could be verified, so Reserve data is owner-entered with a link to the real Reserve. The Solana RPC lookup is a generic read-only account check.
- **Hero video.** Supply your own direct `.mp4` (and poster) via `NEXT_PUBLIC_ASCII_VIDEO_URL` / `NEXT_PUBLIC_ASCII_POSTER_URL`; otherwise a procedural ASCII field is used. `EchoText` and `AsciiArt` are custom implementations, not the React Bits originals.
- **Single administrator**, no roles. Admin writes require the request origin to equal `NEXT_PUBLIC_APP_URL`, so Vercel preview URLs cannot be used to edit data.
- **`pnpm audit --prod`**: 4 moderate advisories remain, all in transitive dependencies of `@solana/web3.js` 1.x (e.g. `jayson` > `stream-json`); they only parse responses from your configured RPC endpoint. Re-run `pnpm audit --prod` before deploying and plan the upgrade.
- The first migration SQL is hand-written to match `schema.prisma`; confirm no drift with `pnpm prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code`.
