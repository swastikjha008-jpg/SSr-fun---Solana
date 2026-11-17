import type { CampaignChecklist as Row, PrismaClient } from "@/generated/prisma/client";
import type { Db } from "@/lib/db";
import type { UpdateCampaignInput } from "@/validation/campaign";
import type { CampaignChecklist, CampaignStep } from "@/shared/contracts";
import { CAMPAIGN_REQUIREMENTS } from "@/config/campaign";
import { recordAudit } from "./audit.service";

const ROW_ID = "primary";

export const CAMPAIGN_NOTICE =
  "All completion flags are self-reported by the owner and are not verified by this app. Signup, Reserve activity, feedback submission and the Superteam Earn entry all happen on SSR.FUN, X and Superteam Earn; this companion does not perform or submit any of them.";

type Fields = Omit<Row, "id" | "updatedAt">;
const EMPTY: Fields = {
  walletAddress: null,
  xHandle: null,
  campaignSignupConfirmed: false,
  reserveOrTradeCompleted: false,
  officialXFollowConfirmed: false,
  investmentPostUrl: null,
  feedbackSubmissionConfirmed: false,
  earnSubmissionConfirmed: false,
};

/** Pure: builds the DTO (steps, progress, warnings) from a row or defaults. */
export function buildChecklist(row: Row | null): CampaignChecklist {
  const f: Fields = row ?? EMPTY;
  const done: Record<CampaignStep["key"], boolean> = {
    campaignSignup: f.campaignSignupConfirmed,
    reserveOrTrade: f.reserveOrTradeCompleted,
    officialXFollow: f.officialXFollowConfirmed,
    investmentPost: !!f.investmentPostUrl,
    feedbackSubmission: f.feedbackSubmissionConfirmed,
    earnSubmission: f.earnSubmissionConfirmed,
  };
  const steps: CampaignStep[] = CAMPAIGN_REQUIREMENTS.map((r) => ({
    key: r.key,
    label: r.label,
    where: r.where,
    done: done[r.key],
    verification: "self_reported",
  }));
  const completed = steps.filter((s) => s.done).length;

  const warnings: string[] = [];
  const earlierIncomplete = steps.filter((s) => s.key !== "earnSubmission" && !s.done).length;
  if (f.earnSubmissionConfirmed && earlierIncomplete > 0) {
    warnings.push(`Superteam Earn submission is marked complete but ${earlierIncomplete} earlier step(s) are not.`);
  }
  if (f.campaignSignupConfirmed && (!f.walletAddress || !f.xHandle)) {
    warnings.push("Signup is marked complete but the registered wallet address and/or X handle are not recorded.");
  }

  return {
    walletAddress: f.walletAddress,
    xHandle: f.xHandle,
    campaignSignupConfirmed: f.campaignSignupConfirmed,
    reserveOrTradeCompleted: f.reserveOrTradeCompleted,
    officialXFollowConfirmed: f.officialXFollowConfirmed,
    investmentPostUrl: f.investmentPostUrl,
    feedbackSubmissionConfirmed: f.feedbackSubmissionConfirmed,
    earnSubmissionConfirmed: f.earnSubmissionConfirmed,
    updatedAt: row ? row.updatedAt.toISOString() : null,
    steps,
    progress: { completed, total: steps.length, percent: Math.round((completed / steps.length) * 100) },
    warnings,
    notice: CAMPAIGN_NOTICE,
  };
}

export async function getChecklist(db: Db): Promise<CampaignChecklist> {
  return buildChecklist(await db.campaignChecklist.findUnique({ where: { id: ROW_ID } }));
}

export async function updateChecklist(db: PrismaClient, input: UpdateCampaignInput, adminUserId: string) {
  const row = await db.$transaction(async (tx) => {
    const saved = await tx.campaignChecklist.upsert({
      where: { id: ROW_ID },
      create: { id: ROW_ID, ...input },
      update: input,
    });
    await recordAudit(tx, { adminUserId, action: "campaign.update", entityType: "CampaignChecklist", entityId: ROW_ID });
    return saved;
  });
  return buildChecklist(row);
}
