import { createRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { getAdminContext } from "@/lib/auth/session";
import type { SessionState } from "@/shared/contracts";

export const GET = createRoute({}, async ({ req }) => {
  const ctx = await getAdminContext(req);
  const body: SessionState = ctx
    ? { authenticated: true, email: ctx.email, expiresAt: ctx.expiresAt.toISOString() }
    : { authenticated: false };
  return ok(body, { headers: { "Cache-Control": "no-store" } });
});
