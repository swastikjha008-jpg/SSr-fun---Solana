import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";

/** HMAC-SHA256 keyed with SESSION_SECRET. Used for session-token storage and throttle keys. */
export function hmac(value: string): string {
  return createHmac("sha256", getEnv().SESSION_SECRET).update(value).digest("hex");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}
