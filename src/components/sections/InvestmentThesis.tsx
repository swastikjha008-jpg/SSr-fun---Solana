import { ArrowUpRight } from "lucide-react";
import type { SiteData } from "@/lib/site-data";
import SectionHeader from "./SectionHeader";
import { Badge } from "@/components/ui/badge";

export default function InvestmentThesis({ thesis, reserve }: Pick<SiteData, "thesis" | "reserve">) {
  return (
    <section id="thesis" className="scroll-mt-16 border-t border-white/[0.06] bg-bg-2 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Investment Thesis"
            title={thesis.title ?? "The thinking behind the Reserve."}
            lead={reserve?.description ?? undefined}
          />
          <Badge className="self-start sm:self-auto">
            {thesis.placeholder ? "Editable placeholder copy" : "Written by the Reserve owner"}
          </Badge>
        </div>

        <ol className="mt-16 divide-y divide-white/10 border-y border-white/10">
          {thesis.sections.map((t, i) => (
            <li key={t.label} className="grid gap-4 py-10 md:grid-cols-[5rem_1fr_1.2fr] md:gap-10">
              <span className="font-display text-5xl font-bold text-white/10 md:text-6xl" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-soft">{t.label}</p>
                <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{t.heading}</h3>
              </div>
              <p className="whitespace-pre-line text-base leading-relaxed text-white/70">{t.body}</p>
            </li>
          ))}
        </ol>

        {(thesis.xPostUrl || reserve?.reserveUrl) && (
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {thesis.xPostUrl && (
              <a href={thesis.xPostUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-accent-soft hover:text-white">
                Read the thesis post on X <ArrowUpRight className="size-4" aria-hidden />
              </a>
            )}
            {reserve?.reserveUrl && (
              <a href={reserve.reserveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-accent-soft hover:text-white">
                View the Reserve on SSR.FUN <ArrowUpRight className="size-4" aria-hidden />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
