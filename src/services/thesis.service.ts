import type { InvestmentThesis as ThesisRow, PrismaClient } from "@/generated/prisma/client";
import type { Db } from "@/lib/db";
import { notFound } from "@/lib/api/errors";
import type { UpsertThesisInput } from "@/validation/thesis";
import type { InvestmentThesis } from "@/shared/contracts";
import { recordAudit } from "./audit.service";

export const toThesisDTO = (t: ThesisRow): InvestmentThesis => ({
  id: t.id,
  reserveId: t.reserveId,
  title: t.title,
  philosophy: t.philosophy,
  investmentRationale: t.investmentRationale,
  strategy: t.strategy,
  riskDisclosure: t.riskDisclosure,
  xPostUrl: t.xPostUrl,
  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
});

export async function getThesis(db: Db, reserveId: string): Promise<ThesisRow> {
  const thesis = await db.investmentThesis.findUnique({ where: { reserveId } });
  if (!thesis) throw notFound("Investment thesis");
  return thesis;
}

export async function upsertThesis(db: PrismaClient, reserveId: string, input: UpsertThesisInput, adminUserId: string) {
  return db.$transaction(async (tx) => {
    const reserve = await tx.reserveProfile.findUnique({ where: { id: reserveId }, select: { id: true } });
    if (!reserve) throw notFound("Reserve");
    const existing = await tx.investmentThesis.findUnique({ where: { reserveId }, select: { id: true } });
    const data = {
      title: input.title,
      philosophy: input.philosophy,
      investmentRationale: input.investmentRationale,
      strategy: input.strategy,
      riskDisclosure: input.riskDisclosure,
      xPostUrl: input.xPostUrl ?? null,
    };
    const thesis = await tx.investmentThesis.upsert({
      where: { reserveId },
      create: { reserveId, ...data },
      update: data,
    });
    await recordAudit(tx, {
      adminUserId,
      action: existing ? "thesis.update" : "thesis.create",
      entityType: "InvestmentThesis",
      entityId: thesis.id,
    });
    return { thesis, created: !existing };
  });
}
