# Architecture

> This repository merges the frontend (landing page + `/admin` owner console) and the backend (`/api/v1/*`) into one Next.js app under `src/`.
> The landing page reads published data directly from the service layer (`src/lib/site-data.ts`), never over HTTP, and falls back to labelled placeholders when no database is configured.

**Pattern:** modular monolith inside Next.js Route Handlers.

```
src/app/api/v1/**/route.ts   thin HTTP layer: parse → call service → ok()/throw
src/lib/api/                 handler wrapper (createRoute/publicRoute/adminRoute), errors, response envelope, parse, pagination
src/lib/auth/                password (bcrypt), crypto (HMAC), session (DB-backed), origin (CSRF), rate-limit (DB-backed)
src/services/                business rules + Prisma access (reserve, portfolio, thesis, feedback, campaign, dashboard, audit)
src/validation/              Zod schemas (strict) for every input
src/shared/contracts.ts      runtime-free types shared with the frontend
src/config/campaign.ts       static, attributed challenge facts and links
src/lib/{env,db,solana}.ts   validated env, lazy Prisma client (pg adapter), read-only Solana helpers
prisma/                      schema, migrations, seed
```

Request flow: `createRoute` → origin check on mutating methods → await params → admin session check → handler → centralised error mapping.
Services receive the Prisma client as a parameter; multi-row changes run in `$transaction` together with their audit record.

## Data model
`ReserveProfile` 1—N `PortfolioAsset` (cascade, unique `(reserveId, symbol)`, integer `allocationBps`, DB `CHECK 0..10000`) · `ReserveProfile` 1—1 `InvestmentThesis` (cascade) ·
`BetaFeedback` (adds `isPublic`, `externalReference`) · `CampaignChecklist` (single row, id `primary`) · `AdminUser` 1—N `AdminSession` / `AuditLog` ·
`LoginAttempt` (throttle counters keyed by HMAC of IP/email).
Additions beyond the brief, each justified: `AdminSession` (revocable server-side sessions), `LoginAttempt` (throttling that works on serverless),
`BetaFeedback.isPublic` ("explicitly approved for public display"), `externalReference` ("confirmation date or reference").
Indexes cover publication/status filters, feedback status/priority/category/public, session expiry, audit lookups.

## Key decisions
- **Integer basis points** everywhere; percent is derived for display only.
- **Provenance by construction:** DTOs label owner-entered vs illustrative vs externally sourced; no market data fields exist, so nothing can be fabricated.
- **Publish gate:** a Reserve can be public only if it links to the real Reserve on SSR.FUN.
- **Sessions in the database** (not JWT) → real logout, rotation invalidation, no secrets in the cookie.
- **Prisma 7** (Rust-free query compiler + `@prisma/adapter-pg`): smaller serverless footprint; client generated to `src/generated/prisma` (git-ignored, built in `postinstall`/`build`).
- **Solana scope:** syntactic address validation + one optional read-only RPC lookup. No SSR.FUN program/API integration, because none could be verified from official public sources.

## Testing strategy
Unit tests for pure rules (allocation, feedback-status rule, campaign progress, validation, throttle state machine, env, errors, Solana helper with mocked RPC) and
integration tests that invoke the real route handlers against an in-process real PostgreSQL (PGlite) with the project's migration applied:
auth/session/lockout/origin, 401 on all 18 admin operations, CRUD for every module, public exposure rules, cascade/CHECK constraints, audit trail, pagination, error handling.
