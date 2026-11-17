import { ArrowDown, ArrowUpRight } from "lucide-react";
import AsciiArt from "@/components/ui/m-ascii";
import EchoText from "@/components/ui/EchoText";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LINKS } from "@/lib/data";
import { cn } from "@/lib/utils";

// Set these to the original video/poster URLs. Without a video the
// component renders a procedural ASCII field as the fallback.
const ASCII_VIDEO_URL = process.env.NEXT_PUBLIC_ASCII_VIDEO_URL;
const ASCII_POSTER_URL = process.env.NEXT_PUBLIC_ASCII_POSTER_URL;

export default function Hero() {
  return (
    <section id="top" className="relative isolate flex min-h-svh items-center overflow-hidden bg-bg">
      <AsciiArt videoUrl={ASCII_VIDEO_URL} posterUrl={ASCII_POSTER_URL} className="-z-30 opacity-70" />
      <div aria-hidden className="absolute inset-0 -z-20 bg-[radial-gradient(70%_60%_at_50%_40%,rgba(5,9,20,0.35),rgba(5,9,20,0.92))]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-bg/80 via-transparent to-bg" />

      <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-32 sm:px-8">
        <div className="rise">
          <Badge className="border-accent-soft/30 text-accent-soft">
            <span className="size-1.5 rounded-full bg-accent-soft" aria-hidden />
            Superteam Earn | Beta Launch Challenge
          </Badge>
        </div>

        <h1 className="rise rise-1 mt-8 max-w-5xl" aria-label="Reserve with Intent.">
          <EchoText
            text="Reserve with Intent."
            as="span"
            echoes={8}
            lag={0.24}
            offset={24}
            direction="right"
            fade={0.72}
            blur={2}
            tint="#7DD3FC"
            echoStyle="solid"
            mode="both"
            trail="auto"
            fontSize="clamp(3rem, 9vw, 7rem)"
            fontWeight={800}
          />
        </h1>

        <p className="rise rise-2 mt-8 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
          Exploring conviction-driven portfolios, transparent allocation strategies, and the future of Solana-native investing.
        </p>

        <div className="rise rise-3 mt-10 flex flex-col gap-3 sm:flex-row">
          <a href="#thesis" className={cn(buttonVariants({ size: "lg" }))}>
            Explore the Thesis <ArrowDown className="size-4" aria-hidden />
          </a>
          <a
            href={LINKS.platform}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Visit SSR.FUN <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </div>

        <p className="rise rise-4 mt-12 max-w-md text-xs leading-relaxed text-white/60">
          Independent companion presentation. Not affiliated with SSR.FUN. All portfolio and feedback content is placeholder.
        </p>
      </div>
    </section>
  );
}
