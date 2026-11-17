import type { PortfolioAsset as AssetRow, PrismaClient } from "@/generated/prisma/client";
import type { Db } from "@/lib/db";
import { notFound, unprocessable, type ErrorDetail } from "@/lib/api/errors";
import { ALLOCATION_TOTAL_BPS, type AssetInput } from "@/validation/portfolio";
import type { AllocationSummary, PortfolioAllocation, PortfolioAsset } from "@/shared/contracts";
import { recordAudit } from "./audit.service";

export const ALLOCATION_DISCLAIMER =
  "Allocations are presentation data entered by the owner. They are not verified on-chain holdings unless an asset's dataProvenance is VERIFIED_EXTERNAL with a sourceUrl. ILLUSTRATIVE entries are examples only.";

export function sumBps(assets: { allocationBps: number }[]): number {
  return assets.reduce((n, a) => n + a.allocationBps, 0);
}

/** Highest allocation first. Array.prototype.sort is stable, so ties keep the caller's order. */
export function sortAssets<T extends { allocationBps: number }>(assets: T[]): T[] {
  return [...assets].sort((a, b) => b.allocationBps - a.allocationBps);
}

/** Pure validation of a full replacement allocation. Empty list is allowed (clears the allocation). */
export function validateAllocation(assets: AssetInput[]): ErrorDetail[] {
  const errors: ErrorDetail[] = [];
  const seen = new Set<string>();
  assets.forEach((a, i) => {
    const sym = a.symbol.toUpperCase();
    if (seen.has(sym)) errors.push({ path: `assets.${i}.symbol`, message: `duplicate symbol ${sym}` });
    seen.add(sym);
    if (a.dataProvenance === "VERIFIED_EXTERNAL" && !a.sourceUrl) {
      errors.push({ path: `assets.${i}.sourceUrl`, message: "required when dataProvenance is VERIFIED_EXTERNAL" });
    }
  });
  if (assets.length > 0) {
    const total = sumBps(assets);
    if (total !== ALLOCATION_TOTAL_BPS) {
      errors.push({
        path: "assets",
        message: `allocations must total ${ALLOCATION_TOTAL_BPS} basis points (100%); received ${total}`,
      });
    }
  }
  return errors;
}

export function summarize(assets: { allocationBps: number; dataProvenance: string }[]): AllocationSummary {
  const totalBps = sumBps(assets);
  return {
    totalBps,
    isComplete: totalBps === ALLOCATION_TOTAL_BPS,
    containsIllustrativeData: assets.some((a) => a.dataProvenance === "ILLUSTRATIVE"),
  };
}

export const toAssetDTO = (a: AssetRow): PortfolioAsset => ({
  id: a.id,
  name: a.name,
  symbol: a.symbol,
  assetType: a.assetType,
  allocationBps: a.allocationBps,
  allocationPercent: a.allocationBps / 100,
  dataProvenance: a.dataProvenance,
  sourceUrl: a.sourceUrl,
  sortOrder: a.sortOrder,
});

export async function getAllocation(db: Db, reserveId: string): Promise<PortfolioAllocation> {
  const rows = await db.portfolioAsset.findMany({ where: { reserveId }, orderBy: [{ sortOrder: "asc" }, { symbol: "asc" }] });
  return { reserveId, assets: rows.map(toAssetDTO), summary: summarize(rows), disclaimer: ALLOCATION_DISCLAIMER };
}

/** Replaces the whole allocation atomically. */
export async function replaceAllocation(db: PrismaClient, reserveId: string, assets: AssetInput[], adminUserId: string) {
  const errors = validateAllocation(assets);
  if (errors.length) throw unprocessable("INVALID_ALLOCATION", "Allocation validation failed", errors);
  const ordered = sortAssets(assets);

  await db.$transaction(async (tx) => {
    const reserve = await tx.reserveProfile.findUnique({ where: { id: reserveId }, select: { id: true } });
    if (!reserve) throw notFound("Reserve");
    await tx.portfolioAsset.deleteMany({ where: { reserveId } });
    if (ordered.length) {
      await tx.portfolioAsset.createMany({
        data: ordered.map((a, index) => ({
          reserveId,
          name: a.name,
          symbol: a.symbol,
          assetType: a.assetType,
          allocationBps: a.allocationBps,
          dataProvenance: a.dataProvenance,
          sourceUrl: a.sourceUrl ?? null,
          sortOrder: index,
        })),
      });
    }
    await recordAudit(tx, { adminUserId, action: "allocation.replace", entityType: "ReserveProfile", entityId: reserveId });
  });
  return getAllocation(db, reserveId);
}
