"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SiteData } from "@/lib/site-data";
import SectionHeader from "./SectionHeader";
import { Badge } from "@/components/ui/badge";

const PROVENANCE_BADGE = {
  ILLUSTRATIVE: "Illustrative",
  OWNER_ENTERED: "Owner-entered",
  VERIFIED_EXTERNAL: "Verified source",
} as const;

export default function AssetAllocation({ allocation }: Pick<SiteData, "allocation">) {
  const { assets, placeholder, disclaimer } = allocation;
  const total = Math.round(assets.reduce((n, a) => n + a.weight, 0) * 100) / 100;
  const hasIllustrative = assets.some((a) => a.provenance === "ILLUSTRATIVE");
  const badge = placeholder || hasIllustrative ? "Illustrative data, not real holdings" : "Owner-entered, not verified on-chain";

  return (
    <section id="allocation" className="scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader eyebrow="Asset Allocation" title="How a Reserve is weighted." />
          <Badge className="self-start border-amber-300/30 text-amber-200 sm:self-auto">{badge}</Badge>
        </div>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="glass rounded-2xl p-6">
            <div className="relative mx-auto h-72 w-full max-w-sm" role="img" aria-label={`Donut chart of portfolio weights totalling ${total}%`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={assets} dataKey="weight" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={3} stroke="none" isAnimationActive={false}>
                    {assets.map((a) => (
                      <Cell key={a.symbol} fill={a.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Weight"]}
                    contentStyle={{ background: "#0A1220", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="font-display text-3xl font-bold text-white">{total}%</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">{placeholder ? "Illustrative" : "Allocated"}</p>
                </div>
              </div>
            </div>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {assets.map((a) => (
              <li key={a.symbol} className="glass rounded-2xl p-5 transition-colors hover:border-accent-soft/40">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5 font-display font-semibold text-white">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: a.color }} aria-hidden />
                    <span className="truncate">{a.name}</span>
                    <span className="text-xs font-normal text-white/50">{a.symbol}</span>
                  </span>
                  <span className="font-display text-xl font-bold text-accent-soft">{a.weight}%</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{a.description}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Badge>{PROVENANCE_BADGE[a.provenance]}</Badge>
                  {a.sourceUrl && (
                    <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-soft hover:text-white">
                      Source
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-white/60">{disclaimer}</p>
      </div>
    </section>
  );
}
