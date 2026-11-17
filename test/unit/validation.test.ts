import { describe, expect, it } from "vitest";
import { httpsUrl, solanaAddress, xHandle, xPostUrl } from "@/validation/common";
import { createReserveSchema, updateReserveSchema } from "@/validation/reserve";
import { updateCampaignSchema } from "@/validation/campaign";
import { createFeedbackSchema } from "@/validation/feedback";
import { slugify } from "@/services/reserve.service";
import { isValidSolanaAddress } from "@/lib/solana";

const WSOL = "So11111111111111111111111111111111111111112";

describe("validation primitives", () => {
  it("validates Solana public addresses", () => {
    expect(isValidSolanaAddress(WSOL)).toBe(true);
    expect(isValidSolanaAddress("11111111111111111111111111111111")).toBe(true);
    for (const bad of ["", "abc", "0OIl" + "1".repeat(40), WSOL + "x", "not a key", "javascript:alert(1)"]) {
      expect(solanaAddress.safeParse(bad).success, bad).toBe(false);
    }
  });

  it("never accepts something that looks like a seed phrase or private key as a wallet address", () => {
    const seed = "legal winner thank year wave sausage worth useful legal winner thank yellow";
    expect(solanaAddress.safeParse(seed).success).toBe(false);
    const secretKey64 = "5".repeat(88);
    expect(solanaAddress.safeParse(secretKey64).success).toBe(false);
  });

  it("normalises X handles", () => {
    expect(xHandle.parse("@Tester_1")).toBe("Tester_1");
    expect(xHandle.safeParse("has space").success).toBe(false);
    expect(xHandle.safeParse("waytoolonghandle_123").success).toBe(false);
  });

  it("accepts only X post URLs for post fields", () => {
    expect(xPostUrl.safeParse("https://x.com/me/status/1234567890").success).toBe(true);
    expect(xPostUrl.safeParse("https://twitter.com/me/status/1234567890").success).toBe(true);
    for (const bad of ["https://x.com/me", "https://evil.com/me/status/1", "http://x.com/me/status/1", "https://x.com.evil.com/me/status/1", "javascript:alert(1)"]) {
      expect(xPostUrl.safeParse(bad).success, bad).toBe(false);
    }
  });

  it("requires https URLs", () => {
    expect(httpsUrl.safeParse("https://ssr.fun/reserve/abc").success).toBe(true);
    expect(httpsUrl.safeParse("http://ssr.fun").success).toBe(false);
    expect(httpsUrl.safeParse("javascript:alert(1)").success).toBe(false);
  });
});

describe("request schemas", () => {
  it("rejects unknown fields (mass-assignment guard)", () => {
    expect(createReserveSchema.safeParse({ name: "R", isAdmin: true }).success).toBe(false);
    expect(updateReserveSchema.safeParse({ id: "x" }).success).toBe(false);
  });

  it("treats empty strings as null for optional fields and defaults to DRAFT", () => {
    const r = createReserveSchema.parse({ name: "R", reserveUrl: "", walletAddress: "" });
    expect(r.reserveUrl).toBeNull();
    expect(r.walletAddress).toBeNull();
    expect(r.publicationStatus).toBe("DRAFT");
  });

  it("requires at least one field for updates", () => {
    expect(updateReserveSchema.safeParse({}).success).toBe(false);
    expect(updateCampaignSchema.safeParse({}).success).toBe(false);
  });

  it("applies feedback defaults", () => {
    const f = createFeedbackSchema.parse({ title: "t", description: "d", category: "BUG_REPORT" });
    expect(f).toMatchObject({ priority: "MEDIUM", status: "OBSERVED", isPublic: false });
  });

  it("slugifies names safely", () => {
    expect(slugify("  My First Reserve!! ")).toBe("my-first-reserve");
    expect(slugify("Ünïcödé Réserve")).toBe("unicode-reserve");
    expect(slugify("###")).toBe("reserve");
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(55);
  });
});
