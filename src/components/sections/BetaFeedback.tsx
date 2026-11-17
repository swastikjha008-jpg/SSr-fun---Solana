"use client";

import { useState } from "react";
import type { SiteData } from "@/lib/site-data";
import { FEEDBACK_CATEGORIES } from "@/lib/data";
import SectionHeader from "./SectionHeader";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_STYLE = {
  Critical: "text-rose-200 border-rose-300/50",
  High: "text-rose-300 border-rose-300/30",
  Medium: "text-amber-200 border-amber-200/30",
  Low: "text-emerald-300 border-emerald-300/30",
} as const;

export default function BetaFeedback({ feedback }: Pick<SiteData, "feedback">) {
  const [active, setActive] = useState<(typeof FEEDBACK_CATEGORIES)[number]>("All");
  const items = active === "All" ? feedback.items : feedback.items.filter((f) => f.category === active);

  return (
    <section id="feedback" className="scroll-mt-16 border-t border-white/[0.06] bg-bg-2 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Beta Feedback"
            title="Notes from testing the beta."
            lead={
              feedback.placeholder
                ? "Cards below are templates. Replace them with real observations from your own use of the product."
                : "Observations from hands-on use of the SSR.FUN beta, published by the owner."
            }
          />
          <Badge className="self-start border-amber-300/30 text-amber-200 sm:self-auto">
            {feedback.placeholder ? "Placeholders, no real findings" : "Owner-published, self-reported"}
          </Badge>
        </div>

        <div role="group" aria-label="Filter feedback by category" className="mt-12 flex flex-wrap gap-2">
          {FEEDBACK_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={active === c}
              onClick={() => setActive(c)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft",
                active === c ? "border-accent-soft bg-accent-soft/10 text-white" : "border-white/15 text-white/60 hover:text-white"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2" aria-live="polite">
          {items.length === 0 && <p className="text-sm text-white/60">No entries in this category yet.</p>}
          {items.map((f) => (
            <article key={f.id} className={cn("glass rounded-2xl p-6", f.placeholder && "border-dashed")}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{f.category}</Badge>
                <Badge className={PRIORITY_STYLE[f.priority]}>{f.priority} priority</Badge>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/65">{f.description}</p>
              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/50">Status: {f.status}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
