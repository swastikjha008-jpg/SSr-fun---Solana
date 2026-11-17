import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { listPublished } from "@/services/reserve.service";
import { getAllocation, ALLOCATION_DISCLAIMER } from "@/services/portfolio.service";
import { getThesis } from "@/services/thesis.service";
import { listPublic } from "@/services/feedback.service";
import {
  APP_NAME,
  CAMPAIGN_REQUIREMENTS,
  EXTERNAL_LINKS,
  PRIZE_TRACKS,
  SITE_DISCLAIMER,
} from "@/config/campaign";
import {
  CHART_COLORS,
  PLACEHOLDER_ALLOCATION,
  PLACEHOLDER_FEEDBACK,
  PLACEHOLDER_THESIS,
  type AllocationView,
  type FeedbackCategoryLabel,
  type FeedbackView,
  type ThesisSection,
} from "@/lib/data";
import type { BetaFeedback, FeedbackCategory, FeedbackStatus } from "@/shared/contracts";

export interface SiteData {
  /** "database" = published owner content; "placeholder" = labelled template content. */
  source: "database" | "placeholder";
  appName: string;
  disclaimer: string;
  requirements: { key: string; label: string; where: string }[];
  prizeTracks: { key: string; label: string; prize: string; criteria: string }[];
  links: typeof EXTERNAL_LINKS;
  reserve: { name: string; slug: string; description: string | null; reserveUrl: string | null } | null;
  thesis: { sections: ThesisSection[]; title: string | null; xPostUrl: string | null; placeholder: boolean };
  allocation: { assets: AllocationView[]; disclaimer: string; placeholder: boolean; complete: boolean };
  feedback: { items: FeedbackView[]; placeholder: boolean };
}

const CATEGORY_LABEL: Record<FeedbackCategory, FeedbackCategoryLabel> = {
  UX_OBSERVATION: "UX Observations",
  BUG_REPORT: "Bug Reports",
  FEATURE_REQUEST: "Feature Suggestions",
  IMPROVEMENT_SUGGESTION: "Improvement Recommendations",
};

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  OBSERVED: "Observed",
  DOCUMENTED: "Documented",
  SUBMITTED_EXTERNALLY: "Submitted via SSR.FUN (self-reported)",
  RESOLVED: "Resolved",
};

const PRIORITY_LABEL = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" } as const;

const PROVENANCE_NOTE = {
  ILLUSTRATIVE: "Illustrative example, not a real holding.",
  OWNER_ENTERED: "Entered by the Reserve owner. Not verified on-chain.",
  VERIFIED_EXTERNAL: "Verified against an external source.",
} as const;

function staticPart() {
  return {
    appName: APP_NAME,
    disclaimer: SITE_DISCLAIMER,
    requirements: CAMPAIGN_REQUIREMENTS.map(({ key, label, where }) => ({ key, label, where })),
    prizeTracks: PRIZE_TRACKS.map((t) => ({ ...t })),
    links: EXTERNAL_LINKS,
  };
}

export function placeholderSiteData(): SiteData {
  return {
    ...staticPart(),
    source: "placeholder",
    reserve: null,
    thesis: { sections: PLACEHOLDER_THESIS, title: null, xPostUrl: null, placeholder: true },
    allocation: { assets: PLACEHOLDER_ALLOCATION, disclaimer: ALLOCATION_DISCLAIMER, placeholder: true, complete: true },
    feedback: { items: PLACEHOLDER_FEEDBACK, placeholder: true },
  };
}

function feedbackView(f: BetaFeedback): FeedbackView {
  const steps = f.reproductionSteps ? `\n\nSteps: ${f.reproductionSteps}` : "";
  return {
    id: f.id,
    title: f.title,
    category: CATEGORY_LABEL[f.category],
    description: `${f.description}${steps}`,
    priority: PRIORITY_LABEL[f.priority],
    status: STATUS_LABEL[f.status],
    placeholder: false,
  };
}

async function load(): Promise<SiteData> {
  getEnv(); // throws when the app is not configured -> placeholder content
  const db = getDb();
  const { items } = await listPublished(db, { page: 1, pageSize: 1 });
  const reserve = items[0];
  const base = placeholderSiteData();
  const feedbackPage = await listPublic(db, { page: 1, pageSize: 50 });
  const feedback = feedbackPage.items.map(feedbackView);
  if (!reserve) {
    return { ...base, feedback: feedback.length ? { items: feedback, placeholder: false } : base.feedback };
  }

  const [allocation, thesisRow] = await Promise.all([
    getAllocation(db, reserve.id),
    getThesis(db, reserve.id).catch(() => null),
  ]);

  const assets: AllocationView[] = allocation.assets.map((a, i) => ({
    name: a.name,
    symbol: a.symbol,
    weight: a.allocationPercent,
    color: CHART_COLORS[i % CHART_COLORS.length]!,
    provenance: a.dataProvenance,
    sourceUrl: a.sourceUrl,
    description: `${a.assetType.replace("_", " ").toLowerCase()}. ${PROVENANCE_NOTE[a.dataProvenance]}`,
  }));

  return {
    ...base,
    source: "database",
    reserve: { name: reserve.name, slug: reserve.slug, description: reserve.description, reserveUrl: reserve.reserveUrl },
    thesis: thesisRow
      ? {
          title: thesisRow.title,
          xPostUrl: thesisRow.xPostUrl,
          placeholder: false,
          sections: [
            { label: "Investment philosophy", heading: "Conviction over noise.", body: thesisRow.philosophy },
            { label: "Asset selection rationale", heading: "Every asset earns its seat.", body: thesisRow.investmentRationale },
            { label: "Portfolio strategy", heading: "Sizing is the strategy.", body: thesisRow.strategy },
            { label: "Risk considerations", heading: "Know what breaks it.", body: thesisRow.riskDisclosure },
          ],
        }
      : base.thesis,
    allocation: assets.length
      ? { assets, disclaimer: allocation.disclaimer, placeholder: false, complete: allocation.summary.isComplete }
      : base.allocation,
    feedback: feedback.length ? { items: feedback, placeholder: false } : base.feedback,
  };
}

/**
 * Server-side loader for the landing page. Reads published data straight from the services (no HTTP hop).
 * Falls back to clearly-labelled placeholder content when the app is unconfigured or the database is
 * unreachable, so the site always renders. Bounded by a timeout so a slow DB can never hang a build.
 */
export async function getSiteData(timeoutMs = 8000): Promise<SiteData> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      load(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("site data timeout")), timeoutMs);
      }),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message.split("\n")[0] : "unknown error";
    console.warn(`[site-data] using placeholder content: ${msg}`);
    return placeholderSiteData();
  } finally {
    if (timer) clearTimeout(timer);
  }
}
