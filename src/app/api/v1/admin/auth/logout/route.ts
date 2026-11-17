import { createRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { clearSessionCookie, destroySession } from "@/lib/auth/session";
import type { SessionState } from "@/shared/contracts";

export const POST = createRoute({}, async ({ req }) => {
  await destroySession(req);
  const body: SessionState = { authenticated: false };
  const res = ok(body);
  clearSessionCookie(res);
  return res;
});
