import { STRATEGY } from "@/lib/data";
import SectionHeader from "./SectionHeader";

export default function StrategyHighlights() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeader eyebrow="Strategy Highlights" title="Principles that guide a Reserve." />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STRATEGY.map((s) => (
            <div
              key={s.title}
              tabIndex={0}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-soft/50 hover:bg-accent-soft/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
            >
              <span className="block h-px w-8 bg-accent-soft transition-all duration-300 group-hover:w-14" aria-hidden />
              <h3 className="mt-6 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
