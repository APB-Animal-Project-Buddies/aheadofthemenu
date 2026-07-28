"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAdminSecret, setAdminSecret, clearAdminSecret, adminHeaders } from "@/lib/admin-client";
import { diffDishFields, formatDishField } from "@/lib/dish-edit-diff";
import { diffEatThisDishFields, formatEatThisField } from "@/lib/eat-this-dish-edit-diff";

const TABS = [
  { key: "dishes", label: "Dishes", list: "/api/admin/edits", act: (id) => `/api/admin/edits/${id}` },
  { key: "eat-this", label: "Eat This!", list: "/api/admin/eat-this/edits", act: (id) => `/api/admin/eat-this/edits/${id}` },
];

export default function AdminEditsPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("dishes");
  const [edits, setEdits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const cfg = TABS.find((t) => t.key === tab);

  useEffect(() => { if (getAdminSecret()) setAuthed(true); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${cfg.list}?status=pending`, { headers: adminHeaders() });
      if (res.status === 401) { clearAdminSecret(); setAuthed(false); setError("Wrong admin secret."); return; }
      if (!res.ok) { setError("Failed to load proposals."); return; }
      const j = await res.json();
      setEdits(j.edits || []);
    } catch { setError("Failed to load proposals."); }
    finally { setLoading(false); }
  }, [cfg.list]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  async function act(id, action) {
    setBusy(id);
    try {
      const res = await fetch(cfg.act(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || `Could not ${action}.`);
      } else {
        setEdits((prev) => prev.filter((e) => e.id !== id));
      }
    } catch { setError(`Could not ${action}.`); }
    finally { setBusy(null); }
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-2xl font-bold text-apb">Admin · Edit proposals</h1>
        <p className="mt-2 text-neutral-600">Enter the admin secret to review suggested edits.</p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); const s = secret.trim(); if (s) { setAdminSecret(s); setAuthed(true); } }}
        >
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-apb"
          />
          <button type="submit" className="rounded-lg bg-apb px-4 py-2 text-sm font-semibold text-white hover:bg-apb-light">
            Continue
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-apb">Pending edit proposals</h1>
        <button
          onClick={() => { clearAdminSecret(); setAuthed(false); setEdits([]); }}
          className="text-sm font-medium text-neutral-500 hover:text-apb"
        >
          Sign out
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setEdits([]); setError(""); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.key ? "bg-apb text-white" : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p className="mt-6 text-neutral-500">Loading…</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {!loading && edits.length === 0 ? (
        <p className="mt-8 text-neutral-600">No pending proposals. 🎉</p>
      ) : null}

      <div className="mt-6 flex flex-col gap-6">
        {edits.map((e) =>
          tab === "dishes"
            ? <DishEditCard key={e.id} e={e} act={act} busy={busy} />
            : <RlEditCard key={e.id} e={e} act={act} busy={busy} />
        )}
      </div>
    </main>
  );
}

function ReviewActions({ e, act, busy }) {
  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={() => act(e.id, "approve")}
        disabled={busy === e.id}
        className="rounded-lg bg-apb px-3 py-1.5 text-sm font-semibold text-white hover:bg-apb-light disabled:opacity-60"
      >
        Approve
      </button>
      <button
        onClick={() => act(e.id, "reject")}
        disabled={busy === e.id}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        Reject
      </button>
    </div>
  );
}

function DiffRows({ changes, cur, prop, format }) {
  if (changes.length === 0) {
    return <p className="text-sm text-neutral-500">No field differences from the current record.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {changes.map(([k, label]) => (
        <div key={k} className="grid grid-cols-1 gap-2 sm:grid-cols-[120px_1fr_1fr]">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</div>
          <div className="rounded-md bg-red-50 p-2 text-xs text-neutral-700">
            <div className="mb-1 font-medium text-red-700">before</div>
            <div className="whitespace-pre-line">{format(k, cur[k])}</div>
          </div>
          <div className="rounded-md bg-green-50 p-2 text-xs text-neutral-700">
            <div className="mb-1 font-medium text-green-700">after</div>
            <div className="whitespace-pre-line">{format(k, prop[k])}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DishEditCard({ e, act, busy }) {
  const cur = e.dish?.dish_data || {};
  const prop = e.proposed_data || {};
  const changes = diffDishFields(cur, prop);
  return (
    <div className="rounded-[16px] border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/dishes/${e.dish_id}`} className="text-lg font-semibold text-apb hover:underline">
            {e.dish?.dish_name || prop.title || `Dish #${e.dish_id}`}
          </Link>
          <p className="mt-0.5 text-xs text-neutral-400">
            {e.proposer?.name ? `by ${e.proposer.name}` : "anonymous"}
            {e.created_at ? ` · ${new Date(e.created_at).toLocaleString()}` : ""}
          </p>
          {e.note ? <p className="mt-2 text-sm italic text-neutral-600">“{e.note}”</p> : null}
        </div>
        <ReviewActions e={e} act={act} busy={busy} />
      </div>
      <div className="mt-4"><DiffRows changes={changes} cur={cur} prop={prop} format={formatDishField} /></div>
    </div>
  );
}

function RlEditCard({ e, act, busy }) {
  const cur = e.dish || {};
  const prop = e.proposed || {};
  const changes = diffEatThisDishFields(cur, prop);
  const who = e.proposer?.metadata?.handle || e.proposer?.displayName || "anonymous";
  return (
    <div className="rounded-[16px] border border-neutral-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/eat-this" className="text-lg font-semibold text-apb hover:underline">
            {e.dish?.name || prop.name || "Dish"}
          </Link>
          <p className="mt-0.5 text-xs text-neutral-400">
            by {who}{e.created_at ? ` · ${new Date(e.created_at).toLocaleString()}` : ""}
          </p>
          {e.note ? <p className="mt-2 text-sm italic text-neutral-600">“{e.note}”</p> : null}
        </div>
        <ReviewActions e={e} act={act} busy={busy} />
      </div>
      <div className="mt-4"><DiffRows changes={changes} cur={cur} prop={prop} format={formatEatThisField} /></div>
    </div>
  );
}
