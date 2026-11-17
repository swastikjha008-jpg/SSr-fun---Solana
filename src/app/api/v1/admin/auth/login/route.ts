import { createRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { unauthorized } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/parse";
import { loginSchema } from "@/validation/auth";
import { verifyAdminCredentials } from "@/lib/auth/password";
import { assertNotLocked, clearFailures, recordFailure, throttleKeys } from "@/lib/auth/rate-limit";
import { issueSession, setSessionCookie } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import type { SessionState } from "@/shared/contracts";

export const POST = createRoute({}, async ({ req, db }) => {
  const { email, password } = await parseJson(req, loginSchema);
  const keys = throttleKeys(req, email);
  await assertNotLocked(keys);

  if (!(await verifyAdminCredentials(email, password))) {
    await recordFailure(keys);
    throw unauthorized("Invalid email or password"); // same message for unknown email and wrong password
  }
  await clearFailures(keys);

  const env = getEnv();
  const admin = await db.adminUser.upsert({
    where: { email: env.ADMIN_EMAIL },
    create: { email: env.ADMIN_EMAIL, passwordHash: env.ADMIN_PASSWORD_HASH },
    update: { passwordHash: env.ADMIN_PASSWORD_HASH },
  });
  const { token, expiresAt } = await issueSession(admin.id);
  const body: SessionState = { authenticated: true, email: admin.email, expiresAt: expiresAt.toISOString() };
  const res = ok(body);
  setSessionCookie(res, token);
  return res;
});
