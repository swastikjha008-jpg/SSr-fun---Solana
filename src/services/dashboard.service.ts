import type { Db } from "@/lib/db";
import type { DashboardOverview, FeedbackCategory, FeedbackStatus } from "@/shared/contracts";
import { EXTERNAL_LINKS } from "@/config/campaign";
import { getChecklist } from "./campaign.service";

const STATUSES: FeedbackStatus[] = ["OBSERVED", "DOCUMENTED", "SUBMITTED_EXTERNALLY", "RESOLVED"];
const CATEGORIES: FeedbackCategory[] = ["UX_OBSERVATION", "BUG_REPORT", "FEATURE_REQUEST", "IMPROVEMENT_SUGGESTION"];

export async function getDashboard(db: Db): Promise<DashboardOverview> {
  const [reserves, reserveTotal, publishedTotal, sums, byStatus, byCategory, submitted, campaign, audit] = await Promise.all([
    db.reserveProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { assets: true } }, thesis: { select: { id: true } } },
    }),
    db.reserveProfile.count(),
    db.reserveProfile.count({ where: { publicationStatus: "PUBLISHED" } }),
    db.portfolioAsset.groupBy({ by: ["reserveId"], _sum: { allocationBps: true } }),
    db.betaFeedback.groupBy({ by: ["status"], _count: { _all: true } }),
    db.betaFeedback.groupBy({ by: ["category"], _count: { _all: true } }),
    db.betaFeedback.count({ where: { externalSubmittedAt: { not: null } } }),
    getChecklist(db),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const totals = new Map(sums.map((s) => [s.reserveId, s._sum.allocationBps ?? 0]));
  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<FeedbackStatus, number>;
  byStatus.forEach((r) => (statusCounts[r.status] = r._count._all));
  const categoryCounts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<FeedbackCategory, number>;
  byCategory.forEach((r) => (categoryCounts[r.category] = r._count._all));

  return {
    reserves: {
      total: reserveTotal,
      published: publishedTotal,
      draft: reserveTotal - publishedTotal,
      items: reserves.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        publicationStatus: r.publicationStatus,
        assetCount: r._count.assets,
        allocationTotalBps: totals.get(r.id) ?? 0,
        hasThesis: r.thesis !== null,
      })),
    },
    feedback: {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      byStatus: statusCounts,
      byCategory: categoryCounts,
      submittedExternallySelfReported: submitted,
    },
    campaign,
    externalLinks: { ...EXTERNAL_LINKS },
    recentActivity: audit.map((a) => ({
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}
