import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { SiteData } from "@/lib/site-data";
import { LINKS } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function FinalCTA({ reserve, disclaimer }: Pick<SiteData, "reserve" | "disclaimer">) {
  return (
    <section className="px-5 pb-12 sm:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-surface px-6 py-20 text-center sm:py-28">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(56,189,248,0.18),transparent_70%)]" />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Think strategically. Build with conviction.
          </h2>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={LINKS.platform} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "lg" }))}>
              Visit SSR.FUN <ArrowUpRight className="size-4" aria-hidden />
            </a>
            <a href={LINKS.challenge} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              View Challenge <ArrowUpRight className="size-4" aria-hidden />
            </a>
            {reserve?.reserveUrl && (
              <a href={reserve.reserveUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}>
                View my Reserve <ArrowUpRight className="size-4" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </div>
      <footer className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 pb-6 text-xs leading-relaxed text-white/60 sm:flex-row sm:justify-between">
        <p className="max-w-3xl">{disclaimer} Not affiliated with SSR.FUN.</p>
        <a href={LINKS.x} target="_blank" rel="noopener noreferrer" className="shrink-0 hover:text-white">@strategicsuperr on X</a>
      </footer>
    </section>
  );
}
