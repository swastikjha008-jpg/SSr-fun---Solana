import { RESERVE_FEATURES } from "@/lib/data";
import SectionHeader from "./SectionHeader";

export default function ReserveOverview() {
  return (
    <section id="overview" className="section-glow scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="Reserve Overview"
          title="What is a Reserve?"
          lead="A Reserve is a portfolio with a point of view: a curated set of assets, an explicit allocation, and the reasoning behind both."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {RESERVE_FEATURES.map((f) => (
            <article
              key={f.title}
              className="glass group rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent-soft/40"
            >
              <span className="font-display text-sm text-accent-soft/80">{f.index}</span>
              <h3 className="mt-10 text-xl font-semibold text-white">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
