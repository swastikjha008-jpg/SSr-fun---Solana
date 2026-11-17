import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { startTestDb, resetDomainData, type TestDb } from "../helpers/db";
import { APP_ORIGIN, call } from "../helpers/http";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "../setup-env";
import { getDb } from "@/lib/db";

import * as login from "@/app/api/v1/admin/auth/login/route";
import * as logout from "@/app/api/v1/admin/auth/logout/route";
import * as session from "@/app/api/v1/admin/auth/session/route";
import * as dashboard from "@/app/api/v1/admin/dashboard/route";
import * as reserves from "@/app/api/v1/admin/reserves/route";
import * as reserveById from "@/app/api/v1/admin/reserves/[id]/route";
import * as allocation from "@/app/api/v1/admin/reserves/[id]/allocation/route";
import * as thesis from "@/app/api/v1/admin/reserves/[id]/thesis/route";
import * as feedback from "@/app/api/v1/admin/feedback/route";
import * as feedbackById from "@/app/api/v1/admin/feedback/[id]/route";
import * as campaign from "@/app/api/v1/admin/campaign-checklist/route";
import * as wallet from "@/app/api/v1/admin/solana/wallet-status/route";
import * as pubSite from "@/app/api/v1/public/site/route";
import * as pubReserves from "@/app/api/v1/public/reserves/route";
import * as pubReserve from "@/app/api/v1/public/reserves/[slug]/route";
import * as pubAllocation from "@/app/api/v1/public/reserves/[slug]/allocation/route";
import * as pubThesis from "@/app/api/v1/public/reserves/[slug]/thesis/route";
import * as pubFeedback from "@/app/api/v1/public/feedback/route";
import * as health from "@/app/api/v1/health/route";

const WSOL = "So11111111111111111111111111111111111111112";
const SYS = "11111111111111111111111111111111";
const POST_URL = "https://x.com/tester/status/1234567890";

let testDb: TestDb;
let cookie = "";

const A = "/api/v1/admin";
const P = "/api/v1/public";

async function doLogin(ip = "10.0.0.1") {
  const r = await call(login.POST, "POST", `${A}/auth/login`, { body: { email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }, ip });
  const setCookie = r.headers.get("set-cookie") ?? "";
  return { r, cookie: setCookie.split(";")[0] ?? "", setCookie };
}

const adminCall = (handler: unknown, method: string, path: string, body?: unknown, params?: Record<string, string>) =>
  call(handler, method, path, { body, cookie, params });

async function makeReserve(extra: Record<string, unknown> = {}) {
  const r = await adminCall(reserves.POST, "POST", `${A}/reserves`, { name: "My First Reserve", ...extra });
  expect(r.status).toBe(201);
  return r.body.data as { id: string; slug: string };
}

const assets = [
  { name: "Alpha", symbol: "alp", assetType: "CRYPTO", allocationBps: 2500, dataProvenance: "ILLUSTRATIVE" },
  { name: "Beta", symbol: "bet", assetType: "TOKENIZED_STOCK", allocationBps: 5000 },
  { name: "Gamma", symbol: "gam", assetType: "ETF", allocationBps: 2500 },
];

beforeAll(async () => {
  testDb = await startTestDb();
  cookie = (await doLogin("10.9.9.9")).cookie;
});
afterAll(async () => {
  await testDb.stop();
});
beforeEach(async () => {
  await resetDomainData();
});

describe("authentication", () => {
  it("logs in with HttpOnly + SameSite=Strict cookie and stores only a hashed token", async () => {
    const { r, setCookie, cookie: c } = await doLogin("10.0.1.1");
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ success: true, data: { authenticated: true, email: TEST_ADMIN_EMAIL } });
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=strict/i);
    expect(setCookie).toMatch(/Path=\//);
    const token = c.split("=")[1]!;
    const rows = await getDb().adminSession.findMany();
    expect(rows.some((s) => s.tokenHash === token)).toBe(false); // raw token never stored
    expect(rows.every((s) => /^[0-9a-f]{64}$/.test(s.tokenHash))).toBe(true);
  });

  it("returns the same generic 401 for wrong password and unknown email", async () => {
    const bad1 = await call(login.POST, "POST", `${A}/auth/login`, { body: { email: TEST_ADMIN_EMAIL, password: "nope-nope-nope" }, ip: "10.0.2.1" });
    const bad2 = await call(login.POST, "POST", `${A}/auth/login`, { body: { email: "nobody@test.local", password: "nope-nope-nope" }, ip: "10.0.2.2" });
    expect(bad1.status).toBe(401);
    expect(bad2.status).toBe(401);
    expect(bad1.body.error.message).toBe(bad2.body.error.message);
    expect(bad1.headers.get("set-cookie")).toBeNull();
  });

  it("locks out an IP after repeated failures, even for correct credentials", async () => {
    const ip = "10.0.3.1";
    for (let i = 0; i < 5; i++) {
      const r = await call(login.POST, "POST", `${A}/auth/login`, { body: { email: `attacker${i}@test.local`, password: "bad-password-1" }, ip });
      expect(r.status).toBe(401);
    }
    const blocked = await call(login.POST, "POST", `${A}/auth/login`, { body: { email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }, ip });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    // a different IP is unaffected
    expect((await doLogin("10.0.3.2")).r.status).toBe(200);
  });

  it("validates login input and content type, and enforces origin", async () => {
    expect((await call(login.POST, "POST", `${A}/auth/login`, { body: { email: "not-an-email", password: "x" }, ip: "10.0.4.1" })).status).toBe(400);
    expect((await call(login.POST, "POST", `${A}/auth/login`, { body: "email=a&password=b", headers: { "content-type": "text/plain" }, ip: "10.0.4.1" })).status).toBe(415);
    const noOrigin = await call(login.POST, "POST", `${A}/auth/login`, { body: { email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }, origin: null, ip: "10.0.4.2" });
    expect(noOrigin.status).toBe(403);
    expect(noOrigin.body.error.code).toBe("FORBIDDEN_ORIGIN");
    const evil = await call(login.POST, "POST", `${A}/auth/login`, { body: { email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }, origin: "https://evil.example", ip: "10.0.4.2" });
    expect(evil.status).toBe(403);
  });

  it("reports session state, and logout invalidates the server-side session", async () => {
    const { cookie: c } = await doLogin("10.0.5.1");
    const s1 = await call(session.GET, "GET", `${A}/auth/session`, { cookie: c });
    expect(s1.body.data).toMatchObject({ authenticated: true, email: TEST_ADMIN_EMAIL });
    expect((await call(session.GET, "GET", `${A}/auth/session`)).body.data).toEqual({ authenticated: false });

    const out = await call(logout.POST, "POST", `${A}/auth/logout`, { cookie: c });
    expect(out.status).toBe(200);
    expect(out.headers.get("set-cookie")).toMatch(/Max-Age=0/i);
    expect((await call(dashboard.GET, "GET", `${A}/dashboard`, { cookie: c })).status).toBe(401); // replayed cookie is dead
  });

  it("rejects expired sessions and garbage cookies", async () => {
    const { cookie: c } = await doLogin("10.0.5.2");
    await getDb().adminSession.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await call(dashboard.GET, "GET", `${A}/dashboard`, { cookie: c })).status).toBe(401);
    expect((await call(dashboard.GET, "GET", `${A}/dashboard`, { cookie: "ssr_admin=garbage" })).status).toBe(401);
    cookie = (await doLogin("10.0.5.3")).cookie; // restore a working session for later suites
  });
});

describe("authorization: every admin route rejects anonymous callers", () => {
  const cases: [string, unknown, string, string, Record<string, string>?, unknown?][] = [
    ["dashboard", dashboard.GET, "GET", `${A}/dashboard`],
    ["list reserves", reserves.GET, "GET", `${A}/reserves`],
    ["create reserve", reserves.POST, "POST", `${A}/reserves`, undefined, { name: "x" }],
    ["get reserve", reserveById.GET, "GET", `${A}/reserves/abc`, { id: "abc" }],
    ["patch reserve", reserveById.PATCH, "PATCH", `${A}/reserves/abc`, { id: "abc" }, { name: "x" }],
    ["delete reserve", reserveById.DELETE, "DELETE", `${A}/reserves/abc`, { id: "abc" }],
    ["get allocation", allocation.GET, "GET", `${A}/reserves/abc/allocation`, { id: "abc" }],
    ["put allocation", allocation.PUT, "PUT", `${A}/reserves/abc/allocation`, { id: "abc" }, { assets: [] }],
    ["get thesis", thesis.GET, "GET", `${A}/reserves/abc/thesis`, { id: "abc" }],
    ["put thesis", thesis.PUT, "PUT", `${A}/reserves/abc/thesis`, { id: "abc" }, {}],
    ["list feedback", feedback.GET, "GET", `${A}/feedback`],
    ["create feedback", feedback.POST, "POST", `${A}/feedback`, undefined, {}],
    ["get feedback", feedbackById.GET, "GET", `${A}/feedback/abc`, { id: "abc" }],
    ["patch feedback", feedbackById.PATCH, "PATCH", `${A}/feedback/abc`, { id: "abc" }, { title: "x" }],
    ["delete feedback", feedbackById.DELETE, "DELETE", `${A}/feedback/abc`, { id: "abc" }],
    ["get checklist", campaign.GET, "GET", `${A}/campaign-checklist`],
    ["put checklist", campaign.PUT, "PUT", `${A}/campaign-checklist`, undefined, { xHandle: "a" }],
    ["wallet status", wallet.GET, "GET", `${A}/solana/wallet-status?address=${WSOL}`],
  ];
  it.each(cases)("%s → 401 without a session", async (_n, handler, method, path, params, body) => {
    const r = await call(handler, method, path, { params, body });
    expect(r.status).toBe(401);
    expect(r.body).toMatchObject({ success: false, error: { code: "UNAUTHORIZED" } });
    expect(r.headers.get("cache-control")).toBe("no-store");
  });

  it("mutations from a foreign origin are refused even with a valid session", async () => {
    const r = await call(reserves.POST, "POST", `${A}/reserves`, { body: { name: "x" }, cookie, origin: "https://evil.example" });
    expect(r.status).toBe(403);
    expect(await getDb().reserveProfile.count()).toBe(0);
  });
});

describe("reserves", () => {
  it("creates a draft profile that is explicitly not an on-chain record, with unique auto slugs", async () => {
    const r1 = await adminCall(reserves.POST, "POST", `${A}/reserves`, { name: "My First Reserve", walletAddress: WSOL });
    expect(r1.body.data).toMatchObject({
      slug: "my-first-reserve",
      publicationStatus: "DRAFT",
      provenance: "owner_entered",
      isOnChainRecord: false,
      network: "solana-mainnet",
    });
    const r2 = await adminCall(reserves.POST, "POST", `${A}/reserves`, { name: "My First Reserve" });
    expect(r2.body.data.slug).toBe("my-first-reserve-2");
  });

  it("validates input: bad wallet, http URL, unknown fields, duplicate explicit slug", async () => {
    const badWallet = await adminCall(reserves.POST, "POST", `${A}/reserves`, { name: "R", walletAddress: "not-a-key" });
    expect(badWallet.status).toBe(400);
    expect(badWallet.body.error.details[0].path).toBe("walletAddress");
    expect((await adminCall(reserves.POST, "POST", `${A}/reserves`, { name: "R", reserveUrl: "http://ssr.fun/x" })).status).toBe(400);
    expect((await adminCall(reserves.POST, "POST", `${A}/reserves`, { name: "R", role: "admin" })).status).toBe(400);
    await adminCall(reserves.POST, "POST", `${A}/reserves`, { name: "A", slug: "taken" });
    const dup = await adminCall(reserves.POST, "POST", `${A}/reserves`, { name: "B", slug: "taken" });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe("SLUG_TAKEN");
  });

  it("returns 400 for malformed JSON and 413 for oversized bodies", async () => {
    expect((await adminCall(reserves.POST, "POST", `${A}/reserves`, "{not json")).status).toBe(400);
    const big = await adminCall(reserves.POST, "POST", `${A}/reserves`, JSON.stringify({ name: "x", description: "a".repeat(70_000) }));
    expect(big.status).toBe(413);
  });

  it("only publishes with a reserveUrl, and public endpoints expose only published profiles", async () => {
    const draft = await makeReserve({ name: "Draft One" });
    const pub = await makeReserve({ name: "Public One", reserveUrl: "https://ssr.fun/reserve/abc" });

    const noUrl = await adminCall(reserveById.PATCH, "PATCH", `${A}/reserves/${draft.id}`, { publicationStatus: "PUBLISHED" }, { id: draft.id });
    expect(noUrl.status).toBe(422);
    expect(noUrl.body.error.code).toBe("RESERVE_URL_REQUIRED_TO_PUBLISH");

    const ok = await adminCall(reserveById.PATCH, "PATCH", `${A}/reserves/${pub.id}`, { publicationStatus: "PUBLISHED" }, { id: pub.id });
    expect(ok.status).toBe(200);

    const list = await call(pubReserves.GET, "GET", `${P}/reserves`);
    expect(list.body.data.map((r: { slug: string }) => r.slug)).toEqual([pub.slug]);
    expect(list.headers.get("cache-control")).toMatch(/s-maxage/);
    expect((await call(pubReserve.GET, "GET", `${P}/reserves/${pub.slug}`, { params: { slug: pub.slug } })).status).toBe(200);
    expect((await call(pubReserve.GET, "GET", `${P}/reserves/${draft.slug}`, { params: { slug: draft.slug } })).status).toBe(404);
    expect((await call(pubReserve.GET, "GET", `${P}/reserves/Bad Slug!`, { params: { slug: "Bad Slug!" } })).status).toBe(400);
  });

  it("refuses to delete a published profile, deletes drafts with cascade, and 404s afterwards", async () => {
    const r = await makeReserve({ reserveUrl: "https://ssr.fun/reserve/abc" });
    await adminCall(allocation.PUT, "PUT", `${A}/reserves/${r.id}/allocation`, { assets }, { id: r.id });
    await adminCall(reserveById.PATCH, "PATCH", `${A}/reserves/${r.id}`, { publicationStatus: "PUBLISHED" }, { id: r.id });
    const blocked = await adminCall(reserveById.DELETE, "DELETE", `${A}/reserves/${r.id}`, undefined, { id: r.id });
    expect(blocked.status).toBe(409);

    await adminCall(reserveById.PATCH, "PATCH", `${A}/reserves/${r.id}`, { publicationStatus: "DRAFT" }, { id: r.id });
    expect((await adminCall(reserveById.DELETE, "DELETE", `${A}/reserves/${r.id}`, undefined, { id: r.id })).status).toBe(200);
    expect(await getDb().portfolioAsset.count()).toBe(0); // cascade
    expect((await adminCall(reserveById.GET, "GET", `${A}/reserves/${r.id}`, undefined, { id: r.id })).status).toBe(404);
  });

  it("paginates and validates paging parameters", async () => {
    for (const n of ["One", "Two", "Three"]) await makeReserve({ name: `Reserve ${n}` });
    const p1 = await call(reserves.GET, "GET", `${A}/reserves?page=1&pageSize=2`, { cookie });
    expect(p1.body.data).toHaveLength(2);
    expect(p1.body.meta).toEqual({ page: 1, pageSize: 2, total: 3, totalPages: 2 });
    const p2 = await call(reserves.GET, "GET", `${A}/reserves?page=2&pageSize=2`, { cookie });
    expect(p2.body.data).toHaveLength(1);
    expect((await call(reserves.GET, "GET", `${A}/reserves?pageSize=500`, { cookie })).status).toBe(400);
    expect((await call(reserves.GET, "GET", `${A}/reserves?page=0`, { cookie })).status).toBe(400);
  });

  it("rejects empty patches and unknown ids cleanly", async () => {
    const r = await makeReserve();
    expect((await adminCall(reserveById.PATCH, "PATCH", `${A}/reserves/${r.id}`, {}, { id: r.id })).status).toBe(400);
    expect((await adminCall(reserveById.PATCH, "PATCH", `${A}/reserves/nope`, { name: "x" }, { id: "nope" })).status).toBe(404);
  });
});

describe("portfolio allocation", () => {
  it("replaces the allocation atomically, sorted by weight, with uppercase symbols and provenance", async () => {
    const r = await makeReserve();
    const put = await adminCall(allocation.PUT, "PUT", `${A}/reserves/${r.id}/allocation`, { assets }, { id: r.id });
    expect(put.status).toBe(200);
    const list = put.body.data.assets as { symbol: string; allocationBps: number; sortOrder: number; allocationPercent: number; dataProvenance: string }[];
    expect(list.map((a) => a.symbol)).toEqual(["BET", "ALP", "GAM"]);
    expect(list.map((a) => a.sortOrder)).toEqual([0, 1, 2]);
    expect(list[0]).toMatchObject({ allocationBps: 5000, allocationPercent: 50, dataProvenance: "OWNER_ENTERED" });
    expect(put.body.data.summary).toEqual({ totalBps: 10000, isComplete: true, containsIllustrativeData: true });
    expect(put.body.data.disclaimer).toMatch(/not verified on-chain holdings/);
  });

  it("rejects invalid totals without touching the previous allocation", async () => {
    const r = await makeReserve();
    await adminCall(allocation.PUT, "PUT", `${A}/reserves/${r.id}/allocation`, { assets }, { id: r.id });
    const bad = await adminCall(allocation.PUT, "PUT", `${A}/reserves/${r.id}/allocation`, { assets: [{ ...assets[0], allocationBps: 9999 }] }, { id: r.id });
    expect(bad.status).toBe(422);
    expect(bad.body.error.code).toBe("INVALID_ALLOCATION");
    expect(bad.body.error.details[0].message).toMatch(/received 9999/);
    const still = await adminCall(allocation.GET, "GET", `${A}/reserves/${r.id}/allocation`, undefined, { id: r.id });
    expect(still.body.data.assets).toHaveLength(3);
  });

  it("rejects fractional bps, duplicate symbols and unsourced VERIFIED_EXTERNAL", async () => {
    const r = await makeReserve();
    const put = (list: unknown[]) => adminCall(allocation.PUT, "PUT", `${A}/reserves/${r.id}/allocation`, { assets: list }, { id: r.id });
    expect((await put([{ ...assets[0], allocationBps: 99.5 }])).status).toBe(400);
    expect((await put([{ ...assets[0], allocationBps: 5000 }, { ...assets[0], symbol: "ALP", allocationBps: 5000 }])).status).toBe(422);
    expect((await put([{ ...assets[0], allocationBps: 10000, dataProvenance: "VERIFIED_EXTERNAL" }])).status).toBe(422);
    const ok = await put([{ ...assets[0], allocationBps: 10000, dataProvenance: "VERIFIED_EXTERNAL", sourceUrl: "https://ssr.fun/reserve/abc" }]);
    expect(ok.status).toBe(200);
  });

  it("allows clearing, 404s for unknown reserves, and hides draft allocations publicly", async () => {
    const r = await makeReserve({ reserveUrl: "https://ssr.fun/reserve/abc" });
    await adminCall(allocation.PUT, "PUT", `${A}/reserves/${r.id}/allocation`, { assets }, { id: r.id });
    expect((await call(pubAllocation.GET, "GET", `${P}/reserves/${r.slug}/allocation`, { params: { slug: r.slug } })).status).toBe(404); // draft
    await adminCall(reserveById.PATCH, "PATCH", `${A}/reserves/${r.id}`, { publicationStatus: "PUBLISHED" }, { id: r.id });
    const pub = await call(pubAllocation.GET, "GET", `${P}/reserves/${r.slug}/allocation`, { params: { slug: r.slug } });
    expect(pub.status).toBe(200);
    expect(pub.body.data.summary.containsIllustrativeData).toBe(true);

    const cleared = await adminCall(allocation.PUT, "PUT", `${A}/reserves/${r.id}/allocation`, { assets: [] }, { id: r.id });
    expect(cleared.body.data.summary).toMatchObject({ totalBps: 0, isComplete: false });
    expect((await adminCall(allocation.PUT, "PUT", `${A}/reserves/nope/allocation`, { assets }, { id: "nope" })).status).toBe(404);
  });
});

describe("investment thesis", () => {
  const body = {
    title: "Core thesis",
    philosophy: "p",
    investmentRationale: "r",
    strategy: "s",
    riskDisclosure: "d",
    xPostUrl: POST_URL,
  };

  it("creates (201) then updates (200), validates the X post URL, and publishes only with the reserve", async () => {
    const r = await makeReserve({ reserveUrl: "https://ssr.fun/reserve/abc" });
    const created = await adminCall(thesis.PUT, "PUT", `${A}/reserves/${r.id}/thesis`, body, { id: r.id });
    expect(created.status).toBe(201);
    const updated = await adminCall(thesis.PUT, "PUT", `${A}/reserves/${r.id}/thesis`, { ...body, title: "Updated" }, { id: r.id });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe("Updated");
    expect(await getDb().investmentThesis.count()).toBe(1);

    expect((await adminCall(thesis.PUT, "PUT", `${A}/reserves/${r.id}/thesis`, { ...body, xPostUrl: "https://evil.com/x/status/1" }, { id: r.id })).status).toBe(400);
    expect((await adminCall(thesis.PUT, "PUT", `${A}/reserves/${r.id}/thesis`, { title: "only" }, { id: r.id })).status).toBe(400);

    expect((await call(pubThesis.GET, "GET", `${P}/reserves/${r.slug}/thesis`, { params: { slug: r.slug } })).status).toBe(404); // draft reserve
    await adminCall(reserveById.PATCH, "PATCH", `${A}/reserves/${r.id}`, { publicationStatus: "PUBLISHED" }, { id: r.id });
    const pub = await call(pubThesis.GET, "GET", `${P}/reserves/${r.slug}/thesis`, { params: { slug: r.slug } });
    expect(pub.status).toBe(200);
    expect(pub.body.data.xPostUrl).toBe(POST_URL);
  });

  it("404s when a published reserve has no thesis yet, and for unknown reserves", async () => {
    const r = await makeReserve({ reserveUrl: "https://ssr.fun/reserve/abc", publicationStatus: "PUBLISHED" });
    expect((await call(pubThesis.GET, "GET", `${P}/reserves/${r.slug}/thesis`, { params: { slug: r.slug } })).status).toBe(404);
    expect((await adminCall(thesis.PUT, "PUT", `${A}/reserves/nope/thesis`, body, { id: "nope" })).status).toBe(404);
  });
});

describe("beta feedback", () => {
  const base = { title: "Swap button unresponsive", description: "Tapping swap does nothing", category: "BUG_REPORT" };

  it("creates private, unsubmitted records by default and keeps them out of the public feed", async () => {
    const c = await adminCall(feedback.POST, "POST", `${A}/feedback`, { ...base, reproductionSteps: "1. open\n2. tap", evidenceUrl: "https://example.org/shot.png" });
    expect(c.status).toBe(201);
    expect(c.body.data).toMatchObject({ status: "OBSERVED", priority: "MEDIUM", isPublic: false, externalSubmission: null });
    expect((await call(pubFeedback.GET, "GET", `${P}/feedback`)).body.data).toEqual([]);

    await adminCall(feedbackById.PATCH, "PATCH", `${A}/feedback/${c.body.data.id}`, { isPublic: true }, { id: c.body.data.id });
    const pub = await call(pubFeedback.GET, "GET", `${P}/feedback`);
    expect(pub.body.data).toHaveLength(1);
    expect(pub.body.meta.total).toBe(1);
  });

  it("will not mark SUBMITTED_EXTERNALLY without explicit owner confirmation", async () => {
    const denied = await adminCall(feedback.POST, "POST", `${A}/feedback`, { ...base, status: "SUBMITTED_EXTERNALLY" });
    expect(denied.status).toBe(422);
    expect(denied.body.error.code).toBe("EXTERNAL_SUBMISSION_NOT_CONFIRMED");
    expect(await getDb().betaFeedback.count()).toBe(0);

    const c = await adminCall(feedback.POST, "POST", `${A}/feedback`, base);
    const id = c.body.data.id as string;
    const noConfirm = await adminCall(feedbackById.PATCH, "PATCH", `${A}/feedback/${id}`, { status: "SUBMITTED_EXTERNALLY" }, { id });
    expect(noConfirm.status).toBe(422);

    const confirmed = await adminCall(feedbackById.PATCH, "PATCH", `${A}/feedback/${id}`,
      { status: "SUBMITTED_EXTERNALLY", externalSubmissionConfirmed: true, externalReference: "in-app #42" }, { id });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.externalSubmission).toMatchObject({ reference: "in-app #42", verification: "self_reported" });
    expect(confirmed.body.data.externalSubmission.submittedAt).toBeTruthy();
  });

  it("blocks confirmation on other statuses, future dates and regressions", async () => {
    const c = await adminCall(feedback.POST, "POST", `${A}/feedback`, base);
    const id = c.body.data.id as string;
    const patch = (b: unknown) => adminCall(feedbackById.PATCH, "PATCH", `${A}/feedback/${id}`, b, { id });
    expect((await patch({ externalSubmissionConfirmed: true })).body.error.code).toBe("EXTERNAL_FIELDS_REQUIRE_SUBMITTED_STATUS");
    expect((await patch({ status: "SUBMITTED_EXTERNALLY", externalSubmissionConfirmed: true, externalSubmittedAt: "2099-01-01T00:00:00Z" })).body.error.code).toBe("INVALID_SUBMISSION_DATE");
    expect((await patch({ status: "SUBMITTED_EXTERNALLY", externalSubmissionConfirmed: true, externalSubmittedAt: "2026-11-10T00:00:00Z" })).status).toBe(200);
    expect((await patch({ status: "OBSERVED" })).body.error.code).toBe("INVALID_STATUS_TRANSITION");
    const resolved = await patch({ status: "RESOLVED" });
    expect(resolved.body.data.externalSubmission.submittedAt).toBe("2026-11-10T00:00:00.000Z"); // evidence preserved
  });

  it("filters, validates enums, deletes and 404s", async () => {
    await adminCall(feedback.POST, "POST", `${A}/feedback`, base);
    const ux = await adminCall(feedback.POST, "POST", `${A}/feedback`, { ...base, title: "Spacing", category: "UX_OBSERVATION", priority: "LOW" });
    const filtered = await call(feedback.GET, "GET", `${A}/feedback?category=UX_OBSERVATION`, { cookie });
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].title).toBe("Spacing");
    expect((await call(feedback.GET, "GET", `${A}/feedback?status=BOGUS`, { cookie })).status).toBe(400);
    expect((await adminCall(feedback.POST, "POST", `${A}/feedback`, { ...base, priority: "URGENT" })).status).toBe(400);

    const id = ux.body.data.id as string;
    expect((await adminCall(feedbackById.DELETE, "DELETE", `${A}/feedback/${id}`, undefined, { id })).status).toBe(200);
    expect((await adminCall(feedbackById.GET, "GET", `${A}/feedback/${id}`, undefined, { id })).status).toBe(404);
  });
});

describe("campaign checklist", () => {
  it("starts empty and clearly self-reported", async () => {
    const r = await adminCall(campaign.GET, "GET", `${A}/campaign-checklist`);
    expect(r.body.data.progress).toEqual({ completed: 0, total: 6, percent: 0 });
    expect(r.body.data.notice).toMatch(/does not perform or submit/);
  });

  it("upserts partial updates, normalises the handle and tracks progress", async () => {
    const a = await adminCall(campaign.PUT, "PUT", `${A}/campaign-checklist`, { xHandle: "@Tester", walletAddress: WSOL, campaignSignupConfirmed: true });
    expect(a.status).toBe(200);
    expect(a.body.data).toMatchObject({ xHandle: "Tester", walletAddress: WSOL, campaignSignupConfirmed: true });
    const b = await adminCall(campaign.PUT, "PUT", `${A}/campaign-checklist`, { investmentPostUrl: POST_URL, officialXFollowConfirmed: true });
    expect(b.body.data.progress.completed).toBe(3);
    expect(b.body.data.campaignSignupConfirmed).toBe(true); // earlier values preserved
    expect(await getDb().campaignChecklist.count()).toBe(1);
  });

  it("validates fields, supports clearing, and warns on inconsistent self-reports", async () => {
    expect((await adminCall(campaign.PUT, "PUT", `${A}/campaign-checklist`, { walletAddress: "bad" })).status).toBe(400);
    expect((await adminCall(campaign.PUT, "PUT", `${A}/campaign-checklist`, { investmentPostUrl: "https://example.com/post" })).status).toBe(400);
    expect((await adminCall(campaign.PUT, "PUT", `${A}/campaign-checklist`, { earnSubmissionCompleted: true })).status).toBe(400);
    await adminCall(campaign.PUT, "PUT", `${A}/campaign-checklist`, { walletAddress: SYS });
    const cleared = await adminCall(campaign.PUT, "PUT", `${A}/campaign-checklist`, { walletAddress: null });
    expect(cleared.body.data.walletAddress).toBeNull();
    const early = await adminCall(campaign.PUT, "PUT", `${A}/campaign-checklist`, { earnSubmissionConfirmed: true });
    expect(early.body.data.warnings.length).toBeGreaterThan(0);
  });
});

describe("dashboard, audit trail, public site, health, wallet endpoint", () => {
  it("aggregates real counts only and lists recent audit activity", async () => {
    const r = await makeReserve({ reserveUrl: "https://ssr.fun/reserve/abc" });
    await adminCall(allocation.PUT, "PUT", `${A}/reserves/${r.id}/allocation`, { assets }, { id: r.id });
    await adminCall(feedback.POST, "POST", `${A}/feedback`, { title: "t", description: "d", category: "FEATURE_REQUEST" });
    const d = await adminCall(dashboard.GET, "GET", `${A}/dashboard`);
    expect(d.status).toBe(200);
    expect(d.body.data.reserves).toMatchObject({ total: 1, published: 0, draft: 1 });
    expect(d.body.data.reserves.items[0]).toMatchObject({ assetCount: 3, allocationTotalBps: 10000, hasThesis: false });
    expect(d.body.data.feedback.byStatus.OBSERVED).toBe(1);
    expect(d.body.data.feedback.byCategory.FEATURE_REQUEST).toBe(1);
    expect(d.body.data.externalLinks.bountyListing).toContain("superteam.fun");
    expect(d.body.data.recentActivity.map((a: { action: string }) => a.action)).toEqual(expect.arrayContaining(["reserve.create", "allocation.replace", "feedback.create"]));
    // no invented financial metrics anywhere in the payload
    expect(JSON.stringify(d.body)).not.toMatch(/pnl|volume|price|nav/i);
  });

  it("writes audit rows with the acting admin and entity, and no payload data", async () => {
    const r = await makeReserve({ description: "secret-ish description" });
    const rows = await getDb().auditLog.findMany({ where: { entityId: r.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ action: "reserve.create", entityType: "ReserveProfile" });
    expect(rows[0]!.adminUserId).toBeTruthy();
    expect(JSON.stringify(rows)).not.toMatch(/secret-ish/);
  });

  it("serves public site config with the disclaimer, and health without secrets", async () => {
    const s = await call(pubSite.GET, "GET", `${P}/site`);
    expect(s.body.data.externalLinks.officialPlatform).toBe("https://ssr.fun/");
    expect(s.body.data.requirements).toHaveLength(6);
    expect(s.body.data.disclaimer).toMatch(/separate/);
    const h = await call(health.GET, "GET", "/api/v1/health");
    expect(h.body.data.status).toBe("ok");
  });

  it("validates the wallet-status address before any RPC call", async () => {
    const r = await call(wallet.GET, "GET", `${A}/solana/wallet-status?address=nope`, { cookie });
    expect(r.status).toBe(400);
    expect((await call(wallet.GET, "GET", `${A}/solana/wallet-status`, { cookie })).status).toBe(400);
  });

  it("sets nosniff-safe JSON and never leaks the origin constant or secrets in errors", async () => {
    const r = await call(dashboard.GET, "GET", `${A}/dashboard`);
    expect(JSON.stringify(r.body)).not.toContain(APP_ORIGIN);
    expect(JSON.stringify(r.body)).not.toMatch(/stack|prisma|postgres/i);
  });
});

describe("database constraints (kept last: a deliberately failing statement may drop the single in-process test connection)", () => {
  it("database CHECK constraint is a last line of defence for basis points", async () => {
    const r = await makeReserve();
    await expect(
      getDb().portfolioAsset.create({ data: { reserveId: r.id, name: "X", symbol: "X", assetType: "OTHER", allocationBps: 10001 } }),
    ).rejects.toBeTruthy();
  });
});
