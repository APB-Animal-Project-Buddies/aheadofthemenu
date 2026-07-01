"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAdminSecret, setAdminSecret, clearAdminSecret, adminHeaders } from "@/lib/admin-client";

// Top-level dish_data fields shown in the diff, in display order.
const FIELDS = [
  ["title", "Title"], ["description", "Description"], ["cuisines", "Cuisines"],
  ["dishType", "Dish type"], ["tags", "Tags"], ["ingredients", "Ingredients"],
  ["steps", "Steps"], ["specialProducts", "Special products"], ["specialEquipment", "Special equipment"],
  ["cost", "Cost"], ["servings", "Servings"], ["prepTime", "Prep time"], ["allergens", "Allergens"],
  ["resourceLink", "Resource link"], ["originalCreator", "Original creator"], ["notes", "Notes"],
];

const changed = (a, b) => JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);

function fmt(key, val) {
  if (val === undefined || val === null || val === "") return "—";
  if (key === "ingredients") {
    return (val || [])
      .map((i) => {
        const line = [i.quantity, (i.unit || "").replace(/_/g, " "), i.name].filter(Boolean).join(" ");
        const sec = i.section ? `[${i.section}] ` : "";
        const alts = (i.alternatives || []).length ? ` (+${i.alternatives.length} alt)` : "";
        return sec + line + alts;
      })
      .join("\n");
  }
  if (key === "steps") return (val || []).map((s, n) => `${n + 1}. ${s}`).join("\n");
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
}

export default function AdminEditsPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [edits, setEdits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => { if (getAdminSecret()) setAuthed(true); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/edits?status=pending", { headers: adminHeaders() });
      if (res.status === 401) { clearAdminSecret(); setAuthed(false); setError("Wrong admin secret."); return; }
      if (!res.ok) { setError("Failed to load proposals."); return; }
      const j = await res.json();
      setEdits(j.edits || []);
    } catch { setError("Failed to load proposals."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  async function act(id, action) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/edits/${id}`, {
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

      {loading ? <p className="mt-6 text-neutral-500">Loading…</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {!loading && edits.length === 0 ? (
        <p className="mt-8 text-neutral-600">No pending proposals. 🎉</p>
      ) : null}

      <div className="mt-6 flex flex-col gap-6">
        {edits.map((e) => {
          const cur = e.dish?.dish_data || {};
          const prop = e.proposed_data || {};
          const changes = FIELDS.filter(([k]) => changed(cur[k], prop[k]));
          return (
            <div key={e.id} className="rounded-[16px] border border-neutral-200 p-5">
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
              </div>

              <div className="mt-4">
                {changes.length === 0 ? (
                  <p className="text-sm text-neutral-500">No field differences from the current recipe.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {changes.map(([k, label]) => (
                      <div key={k} className="grid grid-cols-1 gap-2 sm:grid-cols-[120px_1fr_1fr]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</div>
                        <div className="rounded-md bg-red-50 p-2 text-xs text-neutral-700">
                          <div className="mb-1 font-medium text-red-700">before</div>
                          <div className="whitespace-pre-line">{fmt(k, cur[k])}</div>
                        </div>
                        <div className="rounded-md bg-green-50 p-2 text-xs text-neutral-700">
                          <div className="mb-1 font-medium text-green-700">after</div>
                          <div className="whitespace-pre-line">{fmt(k, prop[k])}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
