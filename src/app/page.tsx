import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import ReserveOverview from "@/components/sections/ReserveOverview";
import InvestmentThesis from "@/components/sections/InvestmentThesis";
import AssetAllocation from "@/components/sections/AssetAllocation";
import BetaFeedback from "@/components/sections/BetaFeedback";
import StrategyHighlights from "@/components/sections/StrategyHighlights";
import ChallengeOverview from "@/components/sections/ChallengeOverview";
import FinalCTA from "@/components/sections/FinalCTA";
import { getSiteData } from "@/lib/site-data";

// Incremental static regeneration: published changes appear within a minute.
export const revalidate = 60;

export default async function Home() {
  const data = await getSiteData();
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ReserveOverview />
        <InvestmentThesis thesis={data.thesis} reserve={data.reserve} />
        <AssetAllocation allocation={data.allocation} />
        <BetaFeedback feedback={data.feedback} />
        <StrategyHighlights />
        <ChallengeOverview requirements={data.requirements} prizeTracks={data.prizeTracks} links={data.links} />
      </main>
      <FinalCTA reserve={data.reserve} disclaimer={data.disclaimer} />
    </>
  );
}
