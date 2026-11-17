import { forbidden } from "@/lib/api/errors";
import { getEnv } from "@/lib/env";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const isMutating = (method: string) => !SAFE_METHODS.has(method.toUpperCase());

/**
 * CSRF defence in depth (cookies are also SameSite=Strict): state-changing requests must
 * carry an Origin (or Referer) matching NEXT_PUBLIC_APP_URL.
 */
export function assertSameOrigin(req: Request): void {
  const expected = new URL(getEnv().NEXT_PUBLIC_APP_URL).origin;
  const origin = req.headers.get("origin");
  let actual: string | null = origin;
  if (!actual) {
    const referer = req.headers.get("referer");
    if (referer) {
      try {
        actual = new URL(referer).origin;
      } catch {
        actual = null;
      }
    }
  }
  if (!actual || actual !== expected) throw forbidden("Request origin not allowed", "FORBIDDEN_ORIGIN");
}
