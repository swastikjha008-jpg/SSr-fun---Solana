# API Reference — `/api/v1`

All responses are JSON:

```jsonc
{ "success": true,  "data": <T>, "meta": { "page": 1, "pageSize": 20, "total": 3, "totalPages": 1 } } // meta only on collections
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [{ "path": "walletAddress", "message": "…" }] } }
```

Types: `src/shared/contracts.ts`. Dates are ISO-8601. Pagination: `?page=1&pageSize=20` (max 100).
Error codes: `VALIDATION_ERROR` 400 · `UNAUTHORIZED` 401 · `FORBIDDEN_ORIGIN` 403 · `NOT_FOUND` 404 · `CONFLICT`/`SLUG_TAKEN`/`RESERVE_PUBLISHED` 409 ·
`PAYLOAD_TOO_LARGE` 413 · `UNSUPPORTED_MEDIA_TYPE` 415 · `UNPROCESSABLE` family 422 (`INVALID_ALLOCATION`, `RESERVE_URL_REQUIRED_TO_PUBLISH`,
`EXTERNAL_SUBMISSION_NOT_CONFIRMED`, `EXTERNAL_FIELDS_REQUIRE_SUBMITTED_STATUS`, `INVALID_STATUS_TRANSITION`, `INVALID_SUBMISSION_DATE`) ·
`RATE_LIMITED` 429 (+`Retry-After`) · `INTERNAL_ERROR` 500 · `UPSTREAM_ERROR` 502.

Public routes are cacheable (`s-maxage=30`). Admin routes are `no-store`. **State-changing requests must send an `Origin` header equal to
`NEXT_PUBLIC_APP_URL`** (browsers do this automatically) and `Content-Type: application/json`.

## Public

| Method & path | Returns |
|---|---|
| `GET /public/site` | `PublicSiteConfig`: links, 6 requirements, prize tracks, disclaimer |
| `GET /public/reserves` | Published `Reserve[]` (paginated) |
| `GET /public/reserves/:slug` | `Reserve` (404 if draft) |
| `GET /public/reserves/:slug/allocation` | `PortfolioAllocation` (assets sorted by weight, `summary`, `disclaimer`) |
| `GET /public/reserves/:slug/thesis` | `InvestmentThesis` |
| `GET /public/feedback` | `BetaFeedback[]` where the owner set `isPublic: true` (paginated) |
| `GET /health` | `{status:"ok"}` (no DB access) |

## Admin (session cookie required)

### Auth
```bash
curl -i -X POST $APP/api/v1/admin/auth/login -H 'Origin: $APP' -H 'Content-Type: application/json' \
  -d '{"email":"admin@yourdomain.com","password":"…"}'      # sets HttpOnly cookie
# → {"success":true,"data":{"authenticated":true,"email":"…","expiresAt":"…"}}
GET  /admin/auth/session   → {"authenticated":false} or {"authenticated":true,"email","expiresAt"}
POST /admin/auth/logout    → deletes the server session, clears cookie
```
Invalid credentials: `401` with one generic message. 5 failures from one IP → `429`.

### Reserves
| Method & path | Body / notes |
|---|---|
| `GET /admin/reserves?status=DRAFT\|PUBLISHED` | paginated |
| `POST /admin/reserves` | `{ name, slug?, description?, reserveUrl? (https), walletAddress? (Solana pubkey), publicationStatus? }` → 201. Slug auto-generated & de-duplicated |
| `GET/PATCH/DELETE /admin/reserves/:id` | PATCH is partial (≥1 field). **Publishing requires `reserveUrl`** (422). **Published profiles can't be deleted** (409); delete cascades assets+thesis |
| `POST /admin/revalidate` | Refreshes the cached public landing page (used by the owner console after edits) |
| `GET /admin/reserves/:id/allocation` | `PortfolioAllocation` |
| `PUT /admin/reserves/:id/allocation` | `{ assets: [{ name, symbol, assetType, allocationBps, dataProvenance?, sourceUrl? }] }` full replace, atomic. Must total **10000** bps (or be empty to clear). Integer bps only, unique symbols, `VERIFIED_EXTERNAL` requires `sourceUrl`. Stored sorted by weight desc |
| `GET /admin/reserves/:id/thesis` | `InvestmentThesis` |
| `PUT /admin/reserves/:id/thesis` | `{ title, philosophy, investmentRationale, strategy, riskDisclosure, xPostUrl? }` → 201 on create, 200 on update. `xPostUrl` must be `https://x.com/<handle>/status/<id>` |

Enums — `assetType`: `CRYPTO|TOKENIZED_STOCK|ETF|OTHER`; `dataProvenance`: `ILLUSTRATIVE|OWNER_ENTERED|VERIFIED_EXTERNAL`.

Example allocation request:
```json
{ "assets": [
  { "name": "Solana", "symbol": "sol", "assetType": "CRYPTO", "allocationBps": 6000, "dataProvenance": "OWNER_ENTERED" },
  { "name": "Example ETF", "symbol": "etf", "assetType": "ETF", "allocationBps": 4000 } ] }
```

### Feedback
| Method & path | Notes |
|---|---|
| `GET /admin/feedback?status=&category=&priority=` | paginated |
| `POST /admin/feedback` | `{ title, description, category, priority?, status?, reproductionSteps?, evidenceUrl?, isPublic?, externalSubmissionConfirmed?, externalSubmittedAt?, externalReference? }` |
| `GET/PATCH/DELETE /admin/feedback/:id` | |

Enums — `category`: `UX_OBSERVATION|BUG_REPORT|FEATURE_REQUEST|IMPROVEMENT_SUGGESTION`; `priority`: `LOW|MEDIUM|HIGH|CRITICAL`;
`status`: `OBSERVED|DOCUMENTED|SUBMITTED_EXTERNALLY|RESOLVED`.

**External submission rule:** a row here is not proof of an SSR.FUN submission. `status: "SUBMITTED_EXTERNALLY"` requires
`externalSubmissionConfirmed: true` (422 otherwise). The response exposes `externalSubmission: { submittedAt, reference, verification: "self_reported" }`.
Confirmed records can't move back to `OBSERVED/DOCUMENTED`; future dates are rejected; external fields are rejected on other statuses.

### Campaign checklist
`GET /admin/campaign-checklist` · `PUT /admin/campaign-checklist` (partial). Fields: `walletAddress`, `xHandle` (`@` stripped),
`campaignSignupConfirmed`, `reserveOrTradeCompleted`, `officialXFollowConfirmed`, `investmentPostUrl` (X post URL),
`feedbackSubmissionConfirmed`, `earnSubmissionConfirmed`. Response adds `steps[]`, `progress {completed,total,percent}`, `warnings[]`
(e.g. Earn marked complete while earlier steps aren't) and a `notice` that everything is self-reported and not submitted by this app.

### Dashboard & Solana
- `GET /admin/dashboard` → `DashboardOverview` (reserve counts + per-reserve asset count/allocation total/thesis flag, feedback counts by status & category, campaign, external links, last 10 audit events). Contains no PnL/volume/price fields.
- `GET /admin/solana/wallet-status?address=<pubkey>` → read-only RPC lookup `{exists, lamports, owner, executable, source:"solana-rpc", fetchedAt, note}`. Not a verification of SSR.FUN activity.

## Frontend integration notes
- Use `credentials: "include"` and same-site hosting (cookies are `SameSite=Strict`).
- Show `disclaimer`, `dataProvenance`, `provenance`, and `verification: "self_reported"` labels in the UI; render `ILLUSTRATIVE` clearly as examples.
- Loading/error states: branch on `success`; show `error.details` per field for 400/422.
