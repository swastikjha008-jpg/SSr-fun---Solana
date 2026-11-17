import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { assertSameOrigin, isMutating } from "@/lib/auth/origin";
import { applyFailure, EMAIL_POLICY, IP_POLICY, isLocked } from "@/lib/auth/rate-limit";
import { hmac, safeEqual } from "@/lib/auth/crypto";
import { verifyAdminCredentials } from "@/lib/auth/password";
import { ApiError, badRequest } from "@/lib/api/errors";
import { handleError } from "@/lib/api/handler";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "../setup-env";

const req = (headers: Record<string, string>) => new NextRequest("http://localhost:3000/x", { method: "POST", headers });

describe("origin checks", () => {
  it("accepts matching Origin or Referer and rejects others/missing", () => {
    expect(() => assertSameOrigin(req({ origin: "http://localhost:3000" }))).not.toThrow();
    expect(() => assertSameOrigin(req({ referer: "http://localhost:3000/admin" }))).not.toThrow();
    expect(() => assertSameOrigin(req({ origin: "https://evil.example" }))).toThrow(/origin/i);
    expect(() => assertSameOrigin(req({}))).toThrow(/origin/i);
  });

  it("flags only unsafe methods as mutating", () => {
    expect(["GET", "HEAD", "OPTIONS"].some(isMutating)).toBe(false);
    expect(["POST", "PUT", "PATCH", "DELETE"].every(isMutating)).toBe(true);
  });
});

describe("login throttling state machine", () => {
  const t0 = new Date("2026-11-15T10:00:00Z");
  it("locks at the threshold and counts within the window", () => {
    let s = applyFailure(null, IP_POLICY, t0);
    for (let i = 1; i < IP_POLICY.maxFailures - 1; i++) s = applyFailure(s, IP_POLICY, t0);
    expect(isLocked(s, t0)).toBe(false);
    s = applyFailure(s, IP_POLICY, t0);
    expect(s.failures).toBe(IP_POLICY.maxFailures);
    expect(isLocked(s, t0)).toBe(true);
    expect(isLocked(s, new Date(t0.getTime() + IP_POLICY.lockMs + 1))).toBe(false);
  });

  it("restarts the count after the window expires", () => {
    const s = applyFailure({ failures: 4, windowStart: t0, lockedUntil: null }, IP_POLICY, new Date(t0.getTime() + IP_POLICY.windowMs + 1));
    expect(s.failures).toBe(1);
  });

  it("uses a looser per-email limit than per-IP", () => {
    expect(EMAIL_POLICY.maxFailures).toBeGreaterThan(IP_POLICY.maxFailures);
  });
});

describe("credentials and hashing", () => {
  it("verifies the configured admin only", async () => {
    expect(await verifyAdminCredentials(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)).toBe(true);
    expect(await verifyAdminCredentials(TEST_ADMIN_EMAIL.toUpperCase(), TEST_ADMIN_PASSWORD)).toBe(true);
    expect(await verifyAdminCredentials(TEST_ADMIN_EMAIL, "wrong")).toBe(false);
    expect(await verifyAdminCredentials("other@test.local", TEST_ADMIN_PASSWORD)).toBe(false);
  });

  it("hmac is deterministic, keyed and one-way-looking; safeEqual compares correctly", () => {
    expect(hmac("a")).toBe(hmac("a"));
    expect(hmac("a")).not.toBe(hmac("b"));
    expect(hmac("a")).toMatch(/^[0-9a-f]{64}$/);
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("centralised error handling", () => {
  it("maps ApiError to its status, code and details", async () => {
    const res = handleError(badRequest("bad", [{ path: "a", message: "b" }]));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: { code: "VALIDATION_ERROR", message: "bad", details: [{ path: "a", message: "b" }] } });
  });

  it("hides internals of unexpected errors", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = handleError(new Error("password=hunter2 at /srv/app/secret.ts:12"));
    const text = JSON.stringify(await res.json());
    expect(res.status).toBe(500);
    expect(text).not.toMatch(/hunter2|secret\.ts|stack/);
    expect(text).toContain("INTERNAL_ERROR");
    spy.mockRestore();
  });

  it("maps known database error codes", () => {
    const dbErr = (code: string) => Object.assign(new Error("x"), { name: "PrismaClientKnownRequestError", code });
    expect(handleError(dbErr("P2002")).status).toBe(409);
    expect(handleError(dbErr("P2025")).status).toBe(404);
  });

  it("adds Retry-After for rate limited responses", () => {
    const res = handleError(new ApiError(429, "RATE_LIMITED", "slow down", undefined, { "Retry-After": "30" }));
    expect(res.headers.get("retry-after")).toBe("30");
  });
});
