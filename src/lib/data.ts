// Static copy plus clearly-labelled PLACEHOLDER content.
// Nothing here represents real holdings, returns, or completed beta testing.
// Real content comes from the database (see src/lib/site-data.ts) once a Reserve is published.

import { EXTERNAL_LINKS } from "@/config/campaign";

export const LINKS = {
  platform: EXTERNAL_LINKS.officialPlatform,
  challenge: EXTERNAL_LINKS.bountyListing,
  x: EXTERNAL_LINKS.officialX,
} as const;

export const NAV = [
  { label: "Overview", href: "#overview" },
  { label: "Investment Thesis", href: "#thesis" },
  { label: "Allocation", href: "#allocation" },
  { label: "Beta Feedback", href: "#feedback" },
] as const;

export const RESERVE_FEATURES = [
  {
    title: "Strategic asset allocation",
    body: "A Reserve is a deliberate portfolio: each position is chosen with a reason and sized with intent, not collected by accident.",
    index: "01",
  },
  {
    title: "Portfolio transparency",
    body: "Allocation and rationale are visible. Anyone reading a Reserve can see what it holds and why it holds it.",
    index: "02",
  },
  {
    title: "Solana ecosystem exposure",
    body: "Built around the Solana ecosystem, so a Reserve expresses a view on where the network and its builders are heading.",
    index: "03",
  },
];

export const STRATEGY = [
  { title: "Strategic thinking", body: "Start from a thesis, then let it constrain every decision that follows." },
  { title: "Asset diversification", body: "Spread exposure so one wrong call does not define the whole Reserve." },
  { title: "Risk awareness", body: "Name the downside next to the upside, every time." },
  { title: "Transparent decision-making", body: "Publish the reasoning so others can challenge it." },
];

/* ------------------------------ view models ------------------------------ */

export type Provenance = "ILLUSTRATIVE" | "OWNER_ENTERED" | "VERIFIED_EXTERNAL";

export interface ThesisSection {
  label: string;
  heading: string;
  body: string;
}

export interface AllocationView {
  name: string;
  symbol: string;
  weight: number;
  color: string;
  description: string;
  provenance: Provenance;
  sourceUrl: string | null;
}

export const FEEDBACK_CATEGORIES = [
  "All",
  "UX Observations",
  "Bug Reports",
  "Feature Suggestions",
  "Improvement Recommendations",
] as const;

export type FeedbackCategoryLabel = Exclude<(typeof FEEDBACK_CATEGORIES)[number], "All">;

export interface FeedbackView {
  id: string;
  title: string;
  category: FeedbackCategoryLabel;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  /** Human label, e.g. "Documented" or "Submitted via SSR.FUN (self-reported)". */
  status: string;
  placeholder: boolean;
}

export const CHART_COLORS = ["#38BDF8", "#2563EB", "#7DD3FC", "#E2E8F0", "#60A5FA", "#0EA5E9", "#93C5FD", "#CBD5E1"];

/* ------------------------------ placeholders ------------------------------ */

export const PLACEHOLDER_THESIS: ThesisSection[] = [
  {
    label: "Investment philosophy",
    heading: "Conviction over noise.",
    body: "[Placeholder] Describe the core belief behind the Reserve: what you think the market is mispricing and the time horizon you are willing to hold it over.",
  },
  {
    label: "Asset selection rationale",
    heading: "Every asset earns its seat.",
    body: "[Placeholder] Explain the criteria used to pick each asset, such as network usage, team quality, liquidity and narrative durability.",
  },
  {
    label: "Portfolio strategy",
    heading: "Sizing is the strategy.",
    body: "[Placeholder] Outline how weights are decided, how core and speculative positions are split, and when the Reserve would rebalance.",
  },
  {
    label: "Risk considerations",
    heading: "Know what breaks it.",
    body: "[Placeholder] List the main risks: concentration, smart-contract and protocol risk, liquidity, regulation and market-wide drawdowns.",
  },
];

export const PLACEHOLDER_ALLOCATION: AllocationView[] = [
  { name: "Core Asset A", symbol: "A", weight: 40, color: CHART_COLORS[0]!, provenance: "ILLUSTRATIVE", sourceUrl: null, description: "Illustrative large-cap anchor position. Replace with a real asset and rationale." },
  { name: "Ecosystem Asset B", symbol: "B", weight: 25, color: CHART_COLORS[1]!, provenance: "ILLUSTRATIVE", sourceUrl: null, description: "Illustrative ecosystem infrastructure exposure. Replace with a real asset and rationale." },
  { name: "Growth Asset C", symbol: "C", weight: 20, color: CHART_COLORS[2]!, provenance: "ILLUSTRATIVE", sourceUrl: null, description: "Illustrative higher-conviction growth position. Replace with a real asset and rationale." },
  { name: "Reserve Buffer D", symbol: "D", weight: 15, color: CHART_COLORS[3]!, provenance: "ILLUSTRATIVE", sourceUrl: null, description: "Illustrative stable or liquid buffer. Replace with a real asset and rationale." },
];

export const PLACEHOLDER_FEEDBACK: FeedbackView[] = [
  { id: "p1", title: "UX observation title", category: "UX Observations", description: "Placeholder. Describe a real flow you tested and what felt clear or confusing.", priority: "Medium", status: "Placeholder", placeholder: true },
  { id: "p2", title: "Bug report title", category: "Bug Reports", description: "Placeholder. Add steps to reproduce, expected result and actual result once a real bug is found.", priority: "High", status: "Placeholder", placeholder: true },
  { id: "p3", title: "Feature suggestion title", category: "Feature Suggestions", description: "Placeholder. Describe a capability you would add and the problem it solves.", priority: "Low", status: "Placeholder", placeholder: true },
  { id: "p4", title: "Improvement recommendation title", category: "Improvement Recommendations", description: "Placeholder. Describe a concrete change to an existing feature and the expected benefit.", priority: "Medium", status: "Placeholder", placeholder: true },
];
