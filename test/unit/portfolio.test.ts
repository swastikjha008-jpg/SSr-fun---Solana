import { describe, expect, it } from "vitest";
import { sortAssets, summarize, sumBps, validateAllocation } from "@/services/portfolio.service";
import { replaceAllocationSchema, type AssetInput } from "@/validation/portfolio";

const a = (symbol: string, allocationBps: number, extra: Partial<AssetInput> = {}): AssetInput => ({
  name: symbol,
  symbol,
  assetType: "CRYPTO",
  allocationBps,
  dataProvenance: "OWNER_ENTERED",
  ...extra,
});

describe("portfolio allocation validation", () => {
  it("accepts exactly 10000 bps", () => {
    expect(validateAllocation([a("A", 6000), a("B", 4000)])).toEqual([]);
  });

  it("rejects totals below and above 10000 with the received total", () => {
    expect(validateAllocation([a("A", 5000), a("B", 4999)])[0]?.message).toMatch(/received 9999/);
    expect(validateAllocation([a("A", 6000), a("B", 4001)])[0]?.message).toMatch(/received 10001/);
  });

  it("allows an empty list (clears allocation)", () => {
    expect(validateAllocation([])).toEqual([]);
  });

  it("rejects duplicate symbols and unsourced VERIFIED_EXTERNAL assets", () => {
    const errs = validateAllocation([a("A", 5000), a("A", 5000, { dataProvenance: "VERIFIED_EXTERNAL" })]);
    expect(errs.map((e) => e.path)).toEqual(expect.arrayContaining(["assets.1.symbol", "assets.1.sourceUrl"]));
  });

  it("uses integer arithmetic: three thirds do not magically sum to 100%", () => {
    expect(sumBps([a("A", 3333), a("B", 3333), a("C", 3333)])).toBe(9999);
    expect(validateAllocation([a("A", 3333), a("B", 3333), a("C", 3334)])).toEqual([]);
  });

  it("sorts by allocation descending and is stable for ties", () => {
    const sorted = sortAssets([a("X", 2000), a("Y", 5000), a("Z", 2000), a("W", 1000)]);
    expect(sorted.map((s) => s.symbol)).toEqual(["Y", "X", "Z", "W"]);
  });

  it("summarises completeness and illustrative data", () => {
    expect(summarize([a("A", 10000, { dataProvenance: "ILLUSTRATIVE" })])).toEqual({
      totalBps: 10000,
      isComplete: true,
      containsIllustrativeData: true,
    });
    expect(summarize([a("A", 500)]).isComplete).toBe(false);
  });

  it("schema rejects fractional and out-of-range basis points and normalises symbols", () => {
    const bad = (bps: number) => replaceAllocationSchema.safeParse({ assets: [{ name: "A", symbol: "a", assetType: "ETF", allocationBps: bps }] }).success;
    expect(bad(33.3)).toBe(false);
    expect(bad(0)).toBe(false);
    expect(bad(10001)).toBe(false);
    const parsed = replaceAllocationSchema.parse({ assets: [{ name: "A", symbol: "sol", assetType: "CRYPTO", allocationBps: 10000 }] });
    expect(parsed.assets[0]?.symbol).toBe("SOL");
    expect(parsed.assets[0]?.dataProvenance).toBe("OWNER_ENTERED");
  });
});
