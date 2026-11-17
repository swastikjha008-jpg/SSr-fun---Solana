"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  AssetType,
  BetaFeedback,
  CampaignChecklist,
  DataProvenance,
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
  InvestmentThesis,
  PortfolioAllocation,
  Reserve,
  SessionState,
} from "@/shared/contracts";
import { Button } from "@/components/ui/button";
import { api, errorText } from "./api";

const field =
  "w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft";
const label = "mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-white/60";
const card = "glass rounded-2xl p-6";

type Tab = "reserve" | "allocation" | "thesis" | "feedback" | "checklist";
const TABS: { id: Tab; name: string }[] = [
  { id: "reserve", name: "Reserve" },
  { id: "allocation", name: "Allocation" },
  { id: "thesis", name: "Thesis" },
  { id: "feedback", name: "Feedback" },
  { id: "checklist", name: "Checklist" },
];

function Notice({ msg }: { msg: { kind: "ok" | "err"; text: string } | null }) {
  if (!msg) return null;
  return (
    <p role={msg.kind === "err" ? "alert" : "status"} className={`mt-4 text-sm ${msg.kind === "err" ? "text-rose-300" : "text-emerald-300"}`}>
      {msg.text}
    </p>
  );
}

type Msg = { kind: "ok" | "err"; text: string } | null;

export default function AdminApp() {
  const [session, setSession] = useState<SessionState | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSession(await api<SessionState>("/admin/auth/session"));
    } catch {
      setSession({ authenticated: false });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return (
    <main className="mx-auto min-h-svh max-w-5xl px-5 py-12 sm:px-8">
      <header className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Private</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Owner console</h1>
          <p className="mt-2 text-sm text-white/60">
            Enter your own presentation data. Nothing here is submitted to SSR.FUN or Superteam Earn.
          </p>
        </div>
        <Link href="/" className="text-sm text-accent-soft hover:text-white">View site</Link>
      </header>
      {session === null ? (
        <p className="text-white/60">Loading…</p>
      ) : session.authenticated ? (
        <Console email={session.email ?? ""} onLogout={refresh} />
      ) : (
        <Login onDone={refresh} />
      )}
    </main>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className={`${card} max-w-md`}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          await api("/admin/auth/login", { method: "POST", body: { email, password } });
          onDone();
        } catch (err) {
          setMsg({ kind: "err", text: errorText(err) });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className={label} htmlFor="email">Email</label>
      <input id="email" className={field} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <label className={`${label} mt-4`} htmlFor="password">Password</label>
      <input id="password" className={field} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <Button type="submit" className="mt-6 w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      <Notice msg={msg} />
    </form>
  );
}

function Console({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("reserve");
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const loadReserves = useCallback(async (pick?: string) => {
    try {
      const list = await api<Reserve[]>("/admin/reserves?pageSize=100");
      setReserves(list);
      setSelected((cur) => pick ?? (list.some((r) => r.id === cur) ? cur : (list[0]?.id ?? "")));
      setLoadErr(null);
    } catch (e) {
      setLoadErr(errorText(e));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReserves();
  }, [loadReserves]);

  const reserve = reserves.find((r) => r.id === selected) ?? null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
        <span>Signed in as {email}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await api("/admin/auth/logout", { method: "POST", body: {} }).catch(() => undefined);
            onLogout();
          }}
        >
          Sign out
        </Button>
      </div>
      {loadErr && <p role="alert" className="mb-4 text-sm text-rose-300">{loadErr}</p>}

      <div role="group" aria-label="Sections" className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft ${
              tab === t.id ? "border-accent-soft bg-accent-soft/10 text-white" : "border-white/15 text-white/60 hover:text-white"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {(tab === "allocation" || tab === "thesis") && (
        <div className="mb-6">
          <label className={label} htmlFor="reserve-select">Reserve</label>
          <select id="reserve-select" className={field} value={selected} onChange={(e) => setSelected(e.target.value)}>
            {reserves.length === 0 && <option value="">Create a Reserve first</option>}
            {reserves.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.publicationStatus.toLowerCase()})</option>
            ))}
          </select>
        </div>
      )}

      {tab === "reserve" && <ReservePanel reserves={reserves} selected={selected} setSelected={setSelected} reload={loadReserves} />}
      {tab === "allocation" && reserve && <AllocationPanel key={reserve.id} reserveId={reserve.id} />}
      {tab === "thesis" && reserve && <ThesisPanel key={reserve.id} reserveId={reserve.id} />}
      {(tab === "allocation" || tab === "thesis") && !reserve && <p className="text-white/60">Create a Reserve profile in the Reserve tab first.</p>}
      {tab === "feedback" && <FeedbackPanel />}
      {tab === "checklist" && <ChecklistPanel />}
    </div>
  );
}

/* ------------------------------- Reserve ------------------------------- */

function ReservePanel({ reserves, selected, setSelected, reload }: { reserves: Reserve[]; selected: string; setSelected: (id: string) => void; reload: (pick?: string) => Promise<void> }) {
  const current = reserves.find((r) => r.id === selected) ?? null;
  // Follows the data until the user explicitly picks a mode (reserves load asynchronously).
  const [picked, setMode] = useState<"edit" | "new" | null>(null);
  const mode: "edit" | "new" = picked ?? (current ? "edit" : "new");
  const [form, setForm] = useState({ name: "", description: "", reserveUrl: "", walletAddress: "" });
  const [msg, setMsg] = useState<Msg>(null);

  useEffect(() => {
    if (mode === "edit" && current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ name: current.name, description: current.description ?? "", reserveUrl: current.reserveUrl ?? "", walletAddress: current.walletAddress ?? "" });
    }
  }, [mode, current]);

  const body = () => ({
    name: form.name,
    description: form.description.trim() || null,
    reserveUrl: form.reserveUrl.trim() || null,
    walletAddress: form.walletAddress.trim() || null,
  });

  async function save(extra: Record<string, unknown> = {}) {
    setMsg(null);
    try {
      if (mode === "new") {
        const b = body();
        const created = await api<Reserve>("/admin/reserves", {
          method: "POST",
          body: { name: b.name, ...(b.description && { description: b.description }), ...(b.reserveUrl && { reserveUrl: b.reserveUrl }), ...(b.walletAddress && { walletAddress: b.walletAddress }) },
        });
        await reload(created.id);
        setMode("edit");
        setMsg({ kind: "ok", text: "Reserve profile created as a draft." });
      } else if (current) {
        await api(`/admin/reserves/${current.id}`, { method: "PATCH", body: { ...body(), ...extra } });
        await reload(current.id);
        setMsg({ kind: "ok", text: "Saved." });
      }
    } catch (e) {
      setMsg({ kind: "err", text: errorText(e) });
    }
  }

  return (
    <div className={card}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          aria-label="Choose Reserve"
          className={`${field} max-w-xs`}
          value={mode === "new" ? "__new" : selected}
          onChange={(e) => {
            if (e.target.value === "__new") {
              setMode("new");
              setForm({ name: "", description: "", reserveUrl: "", walletAddress: "" });
            } else {
              setMode("edit");
              setSelected(e.target.value);
            }
          }}
        >
          {reserves.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.publicationStatus.toLowerCase()})</option>)}
          <option value="__new">+ New Reserve profile</option>
        </select>
        {mode === "edit" && current && (
          <span className="text-xs uppercase tracking-[0.14em] text-white/60">
            Status: {current.publicationStatus}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="r-name">Name</label>
          <input id="r-name" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="r-desc">Short description</label>
          <textarea id="r-desc" className={field} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className={label} htmlFor="r-url">Reserve link on SSR.FUN (https)</label>
          <input id="r-url" className={field} type="url" placeholder="https://ssr.fun/..." value={form.reserveUrl} onChange={(e) => setForm({ ...form, reserveUrl: e.target.value })} />
        </div>
        <div>
          <label className={label} htmlFor="r-wallet">Wallet address (optional)</label>
          <input id="r-wallet" className={field} value={form.walletAddress} onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => save()} disabled={!form.name.trim()}>{mode === "new" ? "Create draft" : "Save changes"}</Button>
        {mode === "edit" && current && current.publicationStatus === "DRAFT" && (
          <Button variant="outline" onClick={() => save({ publicationStatus: "PUBLISHED" })}>Publish</Button>
        )}
        {mode === "edit" && current && current.publicationStatus === "PUBLISHED" && (
          <Button variant="outline" onClick={() => save({ publicationStatus: "DRAFT" })}>Unpublish</Button>
        )}
        {mode === "edit" && current && current.publicationStatus === "DRAFT" && (
          <Button
            variant="ghost"
            onClick={async () => {
              if (!window.confirm(`Delete "${current.name}" and its allocation and thesis?`)) return;
              try {
                await api(`/admin/reserves/${current.id}`, { method: "DELETE" });
                setSelected("");
                setMode("new");
                await reload();
                setMsg({ kind: "ok", text: "Deleted." });
              } catch (e) {
                setMsg({ kind: "err", text: errorText(e) });
              }
            }}
          >
            Delete
          </Button>
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/60">
        Publishing requires the real Reserve link from SSR.FUN. The public site shows the most recently created published profile.
      </p>
      <Notice msg={msg} />
    </div>
  );
}

/* ------------------------------ Allocation ------------------------------ */

interface Row { name: string; symbol: string; assetType: AssetType; percent: string; dataProvenance: DataProvenance; sourceUrl: string }
const emptyRow = (): Row => ({ name: "", symbol: "", assetType: "CRYPTO", percent: "", dataProvenance: "OWNER_ENTERED", sourceUrl: "" });

function AllocationPanel({ reserveId }: { reserveId: string }) {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [msg, setMsg] = useState<Msg>(null);

  useEffect(() => {
    api<PortfolioAllocation>(`/admin/reserves/${reserveId}/allocation`)
      .then((a) => {
        if (a.assets.length)
          setRows(a.assets.map((x) => ({ name: x.name, symbol: x.symbol, assetType: x.assetType, percent: String(x.allocationPercent), dataProvenance: x.dataProvenance, sourceUrl: x.sourceUrl ?? "" })));
      })
      .catch((e) => setMsg({ kind: "err", text: errorText(e) }));
  }, [reserveId]);

  const total = Math.round(rows.reduce((n, r) => n + (Number(r.percent) || 0), 0) * 100) / 100;
  const set = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function save() {
    setMsg(null);
    try {
      const assets = rows.map((r) => ({
        name: r.name,
        symbol: r.symbol,
        assetType: r.assetType,
        allocationBps: Math.round((Number(r.percent) || 0) * 100),
        dataProvenance: r.dataProvenance,
        ...(r.sourceUrl.trim() && { sourceUrl: r.sourceUrl.trim() }),
      }));
      await api(`/admin/reserves/${reserveId}/allocation`, { method: "PUT", body: { assets } });
      setMsg({ kind: "ok", text: "Allocation saved." });
    } catch (e) {
      setMsg({ kind: "err", text: errorText(e) });
    }
  }

  return (
    <div className={card}>
      <div className="space-y-4">
        {rows.map((r, i) => (
          <fieldset key={i} className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-6">
            <legend className="px-1 text-xs text-white/50">Asset {i + 1}</legend>
            <input aria-label={`Asset ${i + 1} name`} className={`${field} sm:col-span-2`} placeholder="Name" value={r.name} onChange={(e) => set(i, { name: e.target.value })} />
            <input aria-label={`Asset ${i + 1} symbol`} className={field} placeholder="Symbol" value={r.symbol} onChange={(e) => set(i, { symbol: e.target.value })} />
            <input aria-label={`Asset ${i + 1} percent`} className={field} type="number" min="0" max="100" step="0.01" placeholder="%" value={r.percent} onChange={(e) => set(i, { percent: e.target.value })} />
            <select aria-label={`Asset ${i + 1} type`} className={field} value={r.assetType} onChange={(e) => set(i, { assetType: e.target.value as AssetType })}>
              {(["CRYPTO", "TOKENIZED_STOCK", "ETF", "OTHER"] as const).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select aria-label={`Asset ${i + 1} provenance`} className={field} value={r.dataProvenance} onChange={(e) => set(i, { dataProvenance: e.target.value as DataProvenance })}>
              {(["ILLUSTRATIVE", "OWNER_ENTERED", "VERIFIED_EXTERNAL"] as const).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input aria-label={`Asset ${i + 1} source URL`} className={`${field} sm:col-span-5`} type="url" placeholder="Source URL (required for VERIFIED_EXTERNAL)" value={r.sourceUrl} onChange={(e) => set(i, { sourceUrl: e.target.value })} />
            <Button variant="ghost" size="sm" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} disabled={rows.length === 1}>Remove</Button>
          </fieldset>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => setRows((rs) => [...rs, emptyRow()])}>Add asset</Button>
        <Button onClick={save}>Save allocation</Button>
        <span className={`text-sm ${total === 100 ? "text-emerald-300" : "text-amber-200"}`}>Total: {total}% (must be 100)</span>
      </div>
      <Notice msg={msg} />
    </div>
  );
}

/* -------------------------------- Thesis -------------------------------- */

function ThesisPanel({ reserveId }: { reserveId: string }) {
  const [f, setF] = useState({ title: "", philosophy: "", investmentRationale: "", strategy: "", riskDisclosure: "", xPostUrl: "" });
  const [msg, setMsg] = useState<Msg>(null);

  useEffect(() => {
    api<InvestmentThesis>(`/admin/reserves/${reserveId}/thesis`)
      .then((t) => setF({ title: t.title, philosophy: t.philosophy, investmentRationale: t.investmentRationale, strategy: t.strategy, riskDisclosure: t.riskDisclosure, xPostUrl: t.xPostUrl ?? "" }))
      .catch(() => undefined); // 404 = no thesis yet
  }, [reserveId]);

  const areas: { key: keyof typeof f; text: string }[] = [
    { key: "philosophy", text: "Investment philosophy" },
    { key: "investmentRationale", text: "Asset selection rationale" },
    { key: "strategy", text: "Portfolio strategy" },
    { key: "riskDisclosure", text: "Risk considerations" },
  ];

  return (
    <div className={card}>
      <label className={label} htmlFor="t-title">Title</label>
      <input id="t-title" className={field} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      {areas.map((a) => (
        <div key={a.key} className="mt-4">
          <label className={label} htmlFor={`t-${a.key}`}>{a.text}</label>
          <textarea id={`t-${a.key}`} className={field} rows={4} value={f[a.key]} onChange={(e) => setF({ ...f, [a.key]: e.target.value })} />
        </div>
      ))}
      <label className={`${label} mt-4`} htmlFor="t-x">X post URL (https://x.com/handle/status/id)</label>
      <input id="t-x" className={field} type="url" value={f.xPostUrl} onChange={(e) => setF({ ...f, xPostUrl: e.target.value })} />
      <Button
        className="mt-6"
        onClick={async () => {
          setMsg(null);
          try {
            await api(`/admin/reserves/${reserveId}/thesis`, { method: "PUT", body: { ...f, xPostUrl: f.xPostUrl.trim() || null } });
            setMsg({ kind: "ok", text: "Thesis saved." });
          } catch (e) {
            setMsg({ kind: "err", text: errorText(e) });
          }
        }}
      >
        Save thesis
      </Button>
      <Notice msg={msg} />
    </div>
  );
}

/* ------------------------------- Feedback ------------------------------- */

const CATS: FeedbackCategory[] = ["UX_OBSERVATION", "BUG_REPORT", "FEATURE_REQUEST", "IMPROVEMENT_SUGGESTION"];
const PRIOS: FeedbackPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES: FeedbackStatus[] = ["OBSERVED", "DOCUMENTED", "SUBMITTED_EXTERNALLY", "RESOLVED"];

function FeedbackPanel() {
  const [items, setItems] = useState<BetaFeedback[]>([]);
  const [msg, setMsg] = useState<Msg>(null);
  const blank = { title: "", description: "", category: "UX_OBSERVATION" as FeedbackCategory, priority: "MEDIUM" as FeedbackPriority, status: "OBSERVED" as FeedbackStatus, reproductionSteps: "", isPublic: false, confirmed: false, reference: "" };
  const [f, setF] = useState(blank);

  const load = useCallback(async () => {
    try {
      setItems(await api<BetaFeedback[]>("/admin/feedback?pageSize=100"));
    } catch (e) {
      setMsg({ kind: "err", text: errorText(e) });
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function create() {
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        title: f.title, description: f.description, category: f.category, priority: f.priority, status: f.status, isPublic: f.isPublic,
      };
      if (f.reproductionSteps.trim()) body.reproductionSteps = f.reproductionSteps;
      if (f.status === "SUBMITTED_EXTERNALLY") {
        body.externalSubmissionConfirmed = f.confirmed;
        body.externalSubmittedAt = new Date().toISOString();
        if (f.reference.trim()) body.externalReference = f.reference.trim();
      }
      await api("/admin/feedback", { method: "POST", body });
      setF(blank);
      await load();
      setMsg({ kind: "ok", text: "Feedback entry added." });
    } catch (e) {
      setMsg({ kind: "err", text: errorText(e) });
    }
  }

  return (
    <div className="space-y-6">
      <div className={card}>
        <h2 className="mb-4 text-lg font-semibold text-white">Add an observation</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="f-title">Title</label>
            <input id="f-title" className={field} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="f-desc">Description</label>
            <textarea id="f-desc" className={field} rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="f-steps">Steps to reproduce (bugs)</label>
            <textarea id="f-steps" className={field} rows={2} value={f.reproductionSteps} onChange={(e) => setF({ ...f, reproductionSteps: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="f-cat">Category</label>
            <select id="f-cat" className={field} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as FeedbackCategory })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div>
            <label className={label} htmlFor="f-prio">Priority</label>
            <select id="f-prio" className={field} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as FeedbackPriority })}>{PRIOS.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div>
            <label className={label} htmlFor="f-status">Status</label>
            <select id="f-status" className={field} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as FeedbackStatus })}>{STATUSES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <label className="flex items-center gap-2 self-end text-sm text-white/80">
            <input type="checkbox" checked={f.isPublic} onChange={(e) => setF({ ...f, isPublic: e.target.checked })} /> Show on public site
          </label>
          {f.status === "SUBMITTED_EXTERNALLY" && (
            <div className="sm:col-span-2 space-y-3 rounded-xl border border-white/10 p-4">
              <label className="flex items-start gap-2 text-sm text-white/80">
                <input type="checkbox" className="mt-1" checked={f.confirmed} onChange={(e) => setF({ ...f, confirmed: e.target.checked })} />
                I confirm I submitted this through SSR.FUN&apos;s in-app feedback button (self-reported).
              </label>
              <input aria-label="External reference" className={field} placeholder="Reference or note (optional)" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} />
            </div>
          )}
        </div>
        <Button className="mt-5" onClick={create} disabled={!f.title.trim() || !f.description.trim()}>Add entry</Button>
        <Notice msg={msg} />
      </div>

      <div className={card}>
        <h2 className="mb-4 text-lg font-semibold text-white">Entries ({items.length})</h2>
        {items.length === 0 && <p className="text-sm text-white/60">Nothing yet. The public site shows labelled placeholders until you publish entries.</p>}
        <ul className="divide-y divide-white/10">
          {items.map((it) => (
            <li key={it.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{it.title}</p>
                <p className="text-xs text-white/50">{it.category} · {it.priority} · {it.status} · {it.isPublic ? "public" : "private"}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={async () => { try { await api(`/admin/feedback/${it.id}`, { method: "PATCH", body: { isPublic: !it.isPublic } }); await load(); } catch (e) { setMsg({ kind: "err", text: errorText(e) }); } }}>
                  {it.isPublic ? "Make private" : "Make public"}
                </Button>
                <Button size="sm" variant="ghost" onClick={async () => { if (!window.confirm("Delete this entry?")) return; try { await api(`/admin/feedback/${it.id}`, { method: "DELETE" }); await load(); } catch (e) { setMsg({ kind: "err", text: errorText(e) }); } }}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------- Checklist ------------------------------- */

function ChecklistPanel() {
  const [c, setC] = useState<CampaignChecklist | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  useEffect(() => {
    api<CampaignChecklist>("/admin/campaign-checklist").then(setC).catch((e) => setMsg({ kind: "err", text: errorText(e) }));
  }, []);

  async function patch(body: Record<string, unknown>) {
    setMsg(null);
    try {
      setC(await api<CampaignChecklist>("/admin/campaign-checklist", { method: "PUT", body }));
    } catch (e) {
      setMsg({ kind: "err", text: errorText(e) });
    }
  }
  if (!c) return <div className={card}><p className="text-white/60">Loading…</p><Notice msg={msg} /></div>;

  const toggles: { key: keyof CampaignChecklist; text: string }[] = [
    { key: "campaignSignupConfirmed", text: "Signed up on SSR.FUN (wallet + X handle)" },
    { key: "reserveOrTradeCompleted", text: "Created a Reserve or traded on SSR.FUN" },
    { key: "officialXFollowConfirmed", text: "Followed the official SSR X account" },
    { key: "feedbackSubmissionConfirmed", text: "Submitted in-app feedback on SSR.FUN" },
    { key: "earnSubmissionConfirmed", text: "Submitted the entry on Superteam Earn" },
  ];

  return (
    <div className={card}>
      <p className="mb-4 text-sm text-white/60">{c.notice}</p>
      <p className="mb-6 text-sm text-white">Progress: {c.progress.completed}/{c.progress.total} ({c.progress.percent}%)</p>
      <div className="space-y-3">
        {toggles.map((t) => (
          <label key={t.key} className="flex items-center gap-3 text-sm text-white/80">
            <input type="checkbox" checked={Boolean(c[t.key])} onChange={(e) => patch({ [t.key]: e.target.checked })} /> {t.text}
          </label>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <ChecklistText id="c-wallet" text="Registered wallet address" value={c.walletAddress ?? ""} onSave={(v) => patch({ walletAddress: v || null })} />
        <ChecklistText id="c-x" text="X handle" value={c.xHandle ?? ""} onSave={(v) => patch({ xHandle: v || null })} />
        <div className="sm:col-span-2">
          <ChecklistText id="c-post" text="Investment thesis post URL (X)" value={c.investmentPostUrl ?? ""} onSave={(v) => patch({ investmentPostUrl: v || null })} />
        </div>
      </div>
      {c.warnings.map((w) => <p key={w} className="mt-4 text-sm text-amber-200">{w}</p>)}
      <Notice msg={msg} />
    </div>
  );
}

function ChecklistText({ id, text, value, onSave }: { id: string; text: string; value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <div>
      <label className={label} htmlFor={id}>{text}</label>
      <input id={id} className={field} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onSave(v)} />
    </div>
  );
}
