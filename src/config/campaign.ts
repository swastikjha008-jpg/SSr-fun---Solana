/**
 * Static, source-attributed campaign facts. These describe activities that happen on
 * SSR.FUN and Superteam Earn; this companion app does not perform any of them.
 */
export const EXTERNAL_LINKS = {
  officialPlatform: "https://ssr.fun/",
  bountyListing: "https://superteam.fun/earn/listing/ssrfun-beta-launch-challenge",
  officialDocumentation: "https://ssr.fun/docs",
  officialX: "https://x.com/strategicsuperr",
  leaderboard: "https://ssr.fun/leaderboard",
} as const;

export const CAMPAIGN_REQUIREMENTS = [
  { key: "campaignSignup", label: "Sign up on SSR.FUN by connecting a wallet and signing a message containing your X handle", where: "SSR.FUN" },
  { key: "reserveOrTrade", label: "Create a Reserve or trade existing Reserves", where: "SSR.FUN" },
  { key: "officialXFollow", label: "Follow the official SSR X account", where: "X" },
  { key: "investmentPost", label: "Publish an X post with your investment thesis and Reserve link", where: "X" },
  { key: "feedbackSubmission", label: "Submit at least one piece of feedback via SSR.FUN's in-app feedback button with the registered wallet connected", where: "SSR.FUN" },
  { key: "earnSubmission", label: "Submit wallet address, X post URL and in-app feedback confirmation through Superteam Earn", where: "Superteam Earn" },
] as const;

export const PRIZE_TRACKS = [
  { key: "highest_volume", label: "Highest Volume", prize: "150 USDC", criteria: "Highest eligible cumulative Reserve or trading volume." },
  { key: "highest_pnl", label: "Highest PnL", prize: "100 USDC", criteria: "Highest eligible Reserve PnL percentage measured from launch NAV at campaign close." },
  { key: "best_beta_contributor", label: "Best Beta Contributor", prize: "50 USDC", criteria: "Quality of investment thesis, actionable feedback, and reproducible bug reports." },
] as const;

export const SITE_DISCLAIMER =
  "This companion app is a separate portfolio presentation and tracking tool. Reserve creation, trading, and in-app feedback happen on SSR.FUN; bounty entries are submitted through Superteam Earn. Data here is owner-entered unless explicitly marked otherwise and is not investment advice.";

export const APP_NAME = "SSR.FUN Beta Challenge Companion";
export const NETWORK = "solana-mainnet";
