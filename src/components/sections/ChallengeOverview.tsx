import { ArrowUpRight } from "lucide-react";
import type { SiteData } from "@/lib/site-data";
import SectionHeader from "./SectionHeader";

export default function ChallengeOverview({ requirements, prizeTracks, links }: Pick<SiteData, "requirements" | "prizeTracks" | "links">) {
  return (
    <section id="challenge" className="scroll-mt-16 border-t border-white/[0.06] bg-bg-2 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="The Challenge"
          title="What the beta challenge asks for."
          lead="Facts from the public Superteam Earn listing. Every step happens on SSR.FUN, X or Superteam Earn; this site only presents the work."
        />
        <div className="mt-14 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <ol className="space-y-3">
            {requirements.map((r, i) => (
              <li key={r.key} className="glass flex gap-4 rounded-2xl p-5">
                <span className="font-display text-lg font-bold text-accent-soft" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-sm leading-relaxed text-white/80">{r.label}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/50">On {r.where}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="space-y-3">
            {prizeTracks.map((t) => (
              <div key={t.key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold text-white">{t.label}</h3>
                  <span className="font-display text-accent-soft">{t.prize}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{t.criteria}</p>
              </div>
            ))}
            <a href={links.bountyListing} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 pt-2 text-sm text-accent-soft hover:text-white">
              Read the full listing <ArrowUpRight className="size-4" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
