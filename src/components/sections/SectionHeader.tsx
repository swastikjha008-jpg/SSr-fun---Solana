export default function SectionHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent-soft">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">{title}</h2>
      {lead && <p className="mt-5 text-base leading-relaxed text-white/60 sm:text-lg">{lead}</p>}
    </div>
  );
}
