/**
 * Shared API contracts. Pure TypeScript types with NO runtime imports, so the frontend can
 * import this file directly (copy it or add a path alias). Dates are ISO-8601 strings.
 */

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: { path: string; message: string }[];
}

export type ApiResponse<T> =
  | { success: true; data: T; meta?: PageMeta }
  | { success: false; error: ApiErrorBody };

export type PublicationStatus = "DRAFT" | "PUBLISHED";
export type AssetType = "CRYPTO" | "TOKENIZED_STOCK" | "ETF" | "OTHER";
export type DataProvenance = "ILLUSTRATIVE" | "OWNER_ENTERED" | "VERIFIED_EXTERNAL";
export type FeedbackCategory = "UX_OBSERVATION" | "BUG_REPORT" | "FEATURE_REQUEST" | "IMPROVEMENT_SUGGESTION";
export type FeedbackPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FeedbackStatus = "OBSERVED" | "DOCUMENTED" | "SUBMITTED_EXTERNALLY" | "RESOLVED";

export interface Reserve {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** Link to the Reserve on SSR.FUN (the Reserve itself is not stored here). */
  reserveUrl: string | null;
  walletAddress: string | null;
  network: string;
  publicationStatus: PublicationStatus;
  /** Always "owner_entered": a profile row is presentation metadata, never an on-chain record. */
  provenance: "owner_entered";
  isOnChainRecord: false;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioAsset {
  id: string;
  name: string;
  symbol: string;
  assetType: AssetType;
  /** Integer basis points; 10000 = 100%. */
  allocationBps: number;
  /** Convenience for display only: allocationBps / 100. */
  allocationPercent: number;
  dataProvenance: DataProvenance;
  sourceUrl: string | null;
  sortOrder: number;
}

export interface AllocationSummary {
  totalBps: number;
  isComplete: boolean;
  containsIllustrativeData: boolean;
}

export interface PortfolioAllocation {
  reserveId: string;
  assets: PortfolioAsset[];
  summary: AllocationSummary;
  disclaimer: string;
}

export interface InvestmentThesis {
  id: string;
  reserveId: string;
  title: string;
  philosophy: string;
  investmentRationale: string;
  strategy: string;
  riskDisclosure: string;
  xPostUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BetaFeedback {
  id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  reproductionSteps: string | null;
  evidenceUrl: string | null;
  isPublic: boolean;
  /** Present only after the owner confirmed an in-app SSR.FUN submission. Always self-reported. */
  externalSubmission: { submittedAt: string; reference: string | null; verification: "self_reported" } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStep {
  key: "campaignSignup" | "reserveOrTrade" | "officialXFollow" | "investmentPost" | "feedbackSubmission" | "earnSubmission";
  label: string;
  where: "SSR.FUN" | "X" | "Superteam Earn";
  done: boolean;
  verification: "self_reported";
}

export interface CampaignChecklist {
  walletAddress: string | null;
  xHandle: string | null;
  campaignSignupConfirmed: boolean;
  reserveOrTradeCompleted: boolean;
  officialXFollowConfirmed: boolean;
  investmentPostUrl: string | null;
  feedbackSubmissionConfirmed: boolean;
  earnSubmissionConfirmed: boolean;
  updatedAt: string | null;
  steps: CampaignStep[];
  progress: { completed: number; total: number; percent: number };
  warnings: string[];
  notice: string;
}

export interface ReserveOverview {
  id: string;
  name: string;
  slug: string;
  publicationStatus: PublicationStatus;
  assetCount: number;
  allocationTotalBps: number;
  hasThesis: boolean;
}

export interface DashboardOverview {
  reserves: { total: number; published: number; draft: number; items: ReserveOverview[] };
  feedback: {
    total: number;
    byStatus: Record<FeedbackStatus, number>;
    byCategory: Record<FeedbackCategory, number>;
    submittedExternallySelfReported: number;
  };
  campaign: CampaignChecklist;
  externalLinks: Record<"officialPlatform" | "bountyListing" | "officialDocumentation" | "officialX" | "leaderboard", string>;
  recentActivity: { action: string; entityType: string; entityId: string | null; createdAt: string }[];
}

export interface PublicSiteConfig {
  appName: string;
  network: string;
  externalLinks: DashboardOverview["externalLinks"];
  requirements: { key: string; label: string; where: string }[];
  prizeTracks: { key: string; label: string; prize: string; criteria: string }[];
  disclaimer: string;
}

export interface SessionState {
  authenticated: boolean;
  email?: string;
  expiresAt?: string;
}

export interface WalletStatus {
  address: string;
  network: "solana-mainnet";
  exists: boolean;
  lamports: number | null;
  owner: string | null;
  executable: boolean | null;
  source: "solana-rpc";
  fetchedAt: string;
  note: string;
}
