# Deploy to Vercel (with Neon PostgreSQL)

## 1. Database
1. Create a free project at neon.tech. Copy the **pooled** connection string (it contains `-pooler`, ends with `?sslmode=require`).
2. Apply the schema once from your machine:
   ```bash
   pnpm install
   DATABASE_URL="<neon pooled or direct url>" pnpm db:deploy
   ```

## 2. Secrets
```bash
pnpm hash-password            # copy the RAW hash (first block) for Vercel
openssl rand -base64 48       # SESSION_SECRET
```

## 3. Vercel
1. Push this folder to a GitHub repository and import it in Vercel (framework: Next.js; install/build commands come from `vercel.json`, pnpm is detected from `packageManager`).
2. Add these Environment Variables (Production):

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon pooled URL |
| `ADMIN_EMAIL` | your real email (not a placeholder domain) |
| `ADMIN_PASSWORD_HASH` | raw bcrypt hash, **no `\` escaping** |
| `SESSION_SECRET` | 32+ random characters |
| `SOLANA_RPC_URL` | your RPC URL (default is the public mainnet endpoint) |
| `NEXT_PUBLIC_APP_URL` | your final `https://...` URL, no trailing slash |
| `NEXT_PUBLIC_ASCII_VIDEO_URL` / `NEXT_PUBLIC_ASCII_POSTER_URL` | optional |

3. Deploy. If you set a custom domain later, update `NEXT_PUBLIC_APP_URL` and redeploy.

## 4. Verify
- `https://<your-url>/api/v1/health` returns `{"success":true,...}`.
- Open `/admin`, sign in, create and publish your Reserve. The landing page updates immediately.
- If every route returns 500, the Vercel function logs name the invalid environment variable (never its value).

## Notes
- Public pages are cached for up to 60 s; the admin console refreshes them on every save.
- Run `pnpm db:deploy` again whenever you add a migration, before deploying.
- Never commit `.env.local`.
