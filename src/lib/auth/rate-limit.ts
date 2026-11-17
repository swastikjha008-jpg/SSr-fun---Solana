import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { tooManyRequests } from "@/lib/api/errors";
import { hmac } from "./crypto";

export interface LimitPolicy {
  maxFailures: number;
  windowMs: number;
  lockMs: number;
}

/** Per-IP limit is strict; per-email limit is looser so a stranger cannot trivially lock the admin out. */
export const IP_POLICY: LimitPolicy = { maxFailures: 5, windowMs: 15 * 60_000, lockMs: 15 * 60_000 };
export const EMAIL_POLICY: LimitPolicy = { maxFailures: 10, windowMs: 15 * 60_000, lockMs: 15 * 60_000 };

export interface AttemptState {
  failures: number;
  windowStart: Date;
  lockedUntil: Date | null;
}

/** Pure state transition for a failed attempt. */
export function applyFailure(state: AttemptState | null, policy: LimitPolicy, now: Date): AttemptState {
  let failures = 1;
  let windowStart = now;
  if (state && now.getTime() - state.windowStart.getTime() < policy.windowMs) {
    failures = state.failures + 1;
    windowStart = state.windowStart;
  }
  const lockedUntil = failures >= policy.maxFailures ? new Date(now.getTime() + policy.lockMs) : null;
  return { failures, windowStart, lockedUntil };
}

export const isLocked = (state: AttemptState | null, now: Date) =>
  !!state?.lockedUntil && state.lockedUntil.getTime() > now.getTime();

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  const first = fwd?.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

export interface ThrottleKeys {
  ip: string;
  email: string;
}

export function throttleKeys(req: NextRequest, email: string): ThrottleKeys {
  return { ip: `login:ip:${hmac(clientIp(req))}`, email: `login:email:${hmac(email.trim().toLowerCase())}` };
}

export async function assertNotLocked(keys: ThrottleKeys): Promise<void> {
  const rows = await getDb().loginAttempt.findMany({ where: { key: { in: [keys.ip, keys.email] } } });
  const now = new Date();
  for (const row of rows) {
    if (isLocked(row, now)) throw tooManyRequests((row.lockedUntil!.getTime() - now.getTime()) / 1000);
  }
}

async function bump(key: string, policy: LimitPolicy): Promise<void> {
  const db = getDb();
  const now = new Date();
  const existing = await db.loginAttempt.findUnique({ where: { key } });
  const next = applyFailure(existing, policy, now);
  await db.loginAttempt.upsert({
    where: { key },
    create: { key, ...next },
    update: next,
  });
}

export async function recordFailure(keys: ThrottleKeys): Promise<void> {
  await bump(keys.ip, IP_POLICY);
  await bump(keys.email, EMAIL_POLICY);
}

export async function clearFailures(keys: ThrottleKeys): Promise<void> {
  await getDb().loginAttempt.deleteMany({ where: { key: { in: [keys.ip, keys.email] } } });
}
