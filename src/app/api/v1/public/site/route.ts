import { publicRoute } from "@/lib/api/handler";
import { ok, PUBLIC_CACHE } from "@/lib/api/response";
import { APP_NAME, CAMPAIGN_REQUIREMENTS, EXTERNAL_LINKS, NETWORK, PRIZE_TRACKS, SITE_DISCLAIMER } from "@/config/campaign";
import type { PublicSiteConfig } from "@/shared/contracts";

export const GET = publicRoute(async () => {
  const data: PublicSiteConfig = {
    appName: APP_NAME,
    network: NETWORK,
    externalLinks: { ...EXTERNAL_LINKS },
    requirements: CAMPAIGN_REQUIREMENTS.map(({ key, label, where }) => ({ key, label, where })),
    prizeTracks: PRIZE_TRACKS.map((t) => ({ ...t })),
    disclaimer: SITE_DISCLAIMER,
  };
  return ok(data, { headers: { "Cache-Control": PUBLIC_CACHE } });
});
