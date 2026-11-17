import type { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { unauthorized } from "@/lib/api/errors";
import { hmac, newSessionToken, safeEqual } from "./crypto";

export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface AdminContext {
  adminUserId: string;
  email: string;
  expiresAt: Date;
}

export function cookieName(): string {
  // __Host- prefix requires Secure + Path=/ + no Domain; only valid over https.
  return getEnv().NODE_ENV === "production" ? "__Host-ssr_admin" : "ssr_admin";
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

export async function issueSession(adminUserId: string): Promise<{ token: string; expiresAt: Date }> {
  const db = getDb();
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await db.adminSession.create({ data: { adminUserId, tokenHash: hmac(token), expiresAt } });
  // Opportunistic cleanup of expired rows.
  await db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return { token, expiresAt };
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(cookieName(), token, cookieOptions(SESSION_TTL_SECONDS));
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(cookieName(), "", cookieOptions(0));
}

export async function destroySession(req: NextRequest): Promise<void> {
  const token = req.cookies.get(cookieName())?.value;
  if (token) await getDb().adminSession.deleteMany({ where: { tokenHash: hmac(token) } });
}

/** Returns the admin context for a valid session, otherwise null. Never throws on a bad cookie. */
export async function getAdminContext(req: NextRequest): Promise<AdminContext | null> {
  const token = req.cookies.get(cookieName())?.value;
  if (!token || token.length > 256) return null;
  const db = getDb();
  const session = await db.adminSession.findUnique({
    where: { tokenHash: hmac(token) },
    include: { adminUser: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await db.adminSession.deleteMany({ where: { id: session.id } });
    return null;
  }
  const env = getEnv();
  // Rotating ADMIN_EMAIL / ADMIN_PASSWORD_HASH invalidates existing sessions.
  if (!safeEqual(session.adminUser.email, env.ADMIN_EMAIL) || !safeEqual(session.adminUser.passwordHash, env.ADMIN_PASSWORD_HASH)) {
    await db.adminSession.deleteMany({ where: { id: session.id } });
    return null;
  }
  return { adminUserId: session.adminUserId, email: session.adminUser.email, expiresAt: session.expiresAt };
}

export async function requireAdmin(req: NextRequest): Promise<AdminContext> {
  const ctx = await getAdminContext(req);
  if (!ctx) throw unauthorized();
  return ctx;
}
