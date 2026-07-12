"use client";

import { useCallback, useEffect, useState } from "react";
import { QrShareCard } from "@/components/QrShareCard";
import { useAuth } from "@/components/AuthProvider";

export type Substitution = {
  from?: string;
  label?: string | null;
  note?: string;
  items?: Array<{ name?: string; quantity?: string; unit?: string }>;
  source?: string;
};

export type ActiveDish = {
  code: string;
  reviewPath: string;
  name: string;
  difficulty: number | null;
  activeUntil: string | null;
  createdAt: string;
  dishId: number;
  dishName: string | null;
  description: string | null;
  originalCreator: string | null;
  allergens: string[];
  // Full detail — populated for the owner's past-meal detail modal.
  chefType?: string | null;
  eventContext?: string | null;
  notes?: string | null;
  substitutions?: Substitution[];
  visibility?: string | null;
};

/** One substitution → readable text (mirrors the dish page's formatter). */
function subText(s: Substitution): string {
  if (s?.note) return s.note;
  const items = Array.isArray(s?.items)
    ? s.items
        .map((x) => [x?.quantity, String(x?.unit ?? "").replace(/_/g, " "), x?.name].filter(Boolean).join(" ").trim())
        .filter(Boolean)
        .join(" + ")
    : "";
  const label = s?.label ? `${s.label}: ` : "";
  const from = s?.from ? `${s.from} → ` : "";
  return `${from}${label}${items}`.trim() || "—";
}

function timeLeft(activeUntil: string | null): string {
  if (!activeUntil) return "";
  const ms = new Date(activeUntil).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

/**
 * Fetches and renders a handle's dish instances.
 *
 * `show` controls which parts render:
 *  - "active" — only currently-active dishes (+ optional aggregate QR).
 *  - "past"   — only closed/expired/never-opened dishes, as a flat list
 *               (owner-only). This is the profile "Past meals" section.
 *  - "both"   — active list + a collapsed "Inactive dishes" section
 *               (owner-only). Default, used by the public active-dishes page.
 */
export function ActiveDishesList({
  handle,
  isOwner,
  userId,
  shareUrl,
  show = "both",
}: {
  handle: string;
  isOwner: boolean;
  userId: string | null;
  shareUrl?: string;
  show?: "active" | "past" | "both";
}) {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;
  const [dishes, setDishes] = useState<ActiveDish[]>([]);
  const [inactive, setInactive] = useState<ActiveDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Owner-only past-meal detail modal + its inline delete-confirm/busy state.
  const [detail, setDetail] = useState<ActiveDish | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // Send the access token so the server can return the owner's private
      // past dishes (active dishes are public and don't require it). The
      // timeout guarantees the request settles, so we never hang on "Loading…".
      const res = await fetch(`/api/active-dishes?handle=${encodeURIComponent(handle)}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setDishes(Array.isArray(data.dishes) ? data.dishes : []);
      setInactive(Array.isArray(data.inactiveDishes) ? data.inactiveDishes : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [handle, accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const deactivate = async (code: string) => {
    await fetch("/api/active-dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(userId ? { "X-User-Id": userId } : {}) },
      body: JSON.stringify({ code }),
    });
    load();
  };

  const openDetail = (d: ActiveDish) => {
    setDetail(d);
    setConfirmingDelete(false);
    setDeleteError(null);
  };
  const closeDetail = () => {
    if (deleting) return; // don't drop the modal mid-request
    setDetail(null);
    setConfirmingDelete(false);
    setDeleteError(null);
  };

  const remove = async (code: string) => {
    if (!accessToken) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/active-dishes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setInactive((prev) => prev.filter((d) => d.code !== code));
      setDetail(null);
      setConfirmingDelete(false);
    } catch {
      setDeleteError("Couldn't delete this meal. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className="mt-6 text-neutral-500">Loading…</p>;
  if (error)
    return (
      <p className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
        Uh oh… dishes were not available this time! Something went wrong&nbsp;:(
      </p>
    );

  const showActive = show === "active" || show === "both";
  const showPast = show === "past" || show === "both";

  return (
    <>
      {showActive && shareUrl && dishes.length > 0 && (
        <QrShareCard
          className="mt-6"
          url={shareUrl}
          title="Scan for all active dishes"
          caption={`One code that opens every dish ${isOwner ? "you have" : `@${handle} has`} open for review — handy when several are going at once.`}
        />
      )}

      {showActive &&
        (dishes.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
            No active dishes right now.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {dishes.map((d) => (
              <li key={d.code} className="relative rounded-xl border border-neutral-200 bg-white p-4">
                {/* Instance short code — the printable/shareable id for this dish instance. */}
                <span className="absolute right-3 top-2 font-mono text-[11px] font-medium tracking-wide text-neutral-400">
                  #{d.code}
                </span>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-neutral-900">{d.dishName ?? `Dish #${d.dishId}`}</div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      by {d.originalCreator ?? d.name} · <span className="text-amber-600">{timeLeft(d.activeUntil)}</span>
                    </div>
                    {d.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{d.description}</p>
                    )}
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <a href={d.reviewPath} className="rounded-full bg-apb px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90">
                      Review
                    </a>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => deactivate(d.code)}
                        className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:border-red-300 hover:text-red-600"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
                {/* Always-visible footer: allergens + link to the full recipe
                    (with this dish instance passed as a query param). */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
                  {d.allergens.length > 0 && (
                    <>
                      <span className="text-xs font-medium text-neutral-500">Allergens:</span>
                      {d.allergens.map((a) => (
                        <span key={a} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium capitalize text-amber-800">
                          {a}
                        </span>
                      ))}
                    </>
                  )}
                  <a
                    href={`/dishes/${d.dishId}?instance=${d.code}`}
                    className="ml-auto text-sm font-medium text-apb hover:underline"
                  >
                    View full recipe →
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {/* Past meals as its own flat list (profile). */}
      {showPast && show === "past" && isOwner &&
        (inactive.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
            No past meals yet.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {inactive.map((d) => (
              <li key={d.code}>
                <button
                  type="button"
                  onClick={() => openDetail(d)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-neutral-700">{d.dishName ?? `Dish #${d.dishId}`}</div>
                    <div className="mt-0.5 text-xs text-neutral-400">
                      by {d.name} · {d.activeUntil ? `ended ${new Date(d.activeUntil).toLocaleDateString()}` : "never opened for review"}
                    </div>
                  </div>
                  <span aria-hidden className="flex-none text-neutral-300">›</span>
                </button>
              </li>
            ))}
          </ul>
        ))}

      {/* Inactive dishes collapsed within the active view (public page). */}
      {showPast && show === "both" && isOwner && inactive.length > 0 && (
        <details className="group mt-8 rounded-xl border border-neutral-200 bg-white">
          <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-medium text-neutral-600 [&::-webkit-details-marker]:hidden">
            <span>Inactive dishes ({inactive.length})</span>
            <span className="text-neutral-400 transition group-open:rotate-180">▾</span>
          </summary>
          <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
            {inactive.map((d) => (
              <li key={d.code}>
                <button
                  type="button"
                  onClick={() => openDetail(d)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-neutral-700">{d.dishName ?? `Dish #${d.dishId}`}</div>
                    <div className="mt-0.5 text-xs text-neutral-400">
                      by {d.name} · {d.activeUntil ? `ended ${new Date(d.activeUntil).toLocaleDateString()}` : "never opened for review"}
                    </div>
                  </div>
                  <span aria-hidden className="flex-none text-neutral-300">›</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Owner-only past-meal detail modal — full instance detail + delete. */}
      {detail && isOwner && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onClick={closeDetail}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-serif text-xl font-semibold text-apb">
                  {detail.dishName ?? `Dish #${detail.dishId}`}
                </h3>
                <p className="mt-0.5 text-sm text-neutral-500">
                  by {detail.name}
                  {detail.chefType ? ` · ${detail.chefType}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                aria-label="Close"
                className="flex-none rounded-full px-2 text-lg text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <Detail label="Status">
                {detail.activeUntil
                  ? `Ended ${new Date(detail.activeUntil).toLocaleDateString()}`
                  : "Never opened for review"}
              </Detail>
              {detail.createdAt ? (
                <Detail label="Logged">{new Date(detail.createdAt).toLocaleDateString()}</Detail>
              ) : null}
              {detail.eventContext ? <Detail label="Where">{detail.eventContext}</Detail> : null}
              {detail.difficulty != null ? (
                <Detail label="Difficulty">
                  <span className="font-medium text-apb">{detail.difficulty}</span>/5
                </Detail>
              ) : null}
              {detail.visibility ? (
                <Detail label="Visibility">
                  <span className="capitalize">{detail.visibility}</span>
                  {detail.visibility === "public" ? " · shown on the dish page" : ""}
                </Detail>
              ) : null}
              {detail.allergens.length ? (
                <Detail label="Allergens">
                  <span className="flex flex-wrap gap-1.5">
                    {detail.allergens.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium capitalize text-amber-800"
                      >
                        {a}
                      </span>
                    ))}
                  </span>
                </Detail>
              ) : null}
              {detail.substitutions && detail.substitutions.length ? (
                <Detail label="Substitutions">
                  <ul className="list-disc space-y-0.5 pl-4">
                    {detail.substitutions.map((s, i) => (
                      <li key={`${detail.code}-sub-${i}`}>{subText(s)}</li>
                    ))}
                  </ul>
                </Detail>
              ) : null}
              {detail.notes ? (
                <Detail label="Notes">
                  <span className="italic text-neutral-600">&ldquo;{detail.notes}&rdquo;</span>
                </Detail>
              ) : null}
            </dl>

            <div className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
              <a
                href={`/dishes/${detail.dishId}?instance=${detail.code}`}
                className="text-sm font-medium text-apb hover:underline"
              >
                View full recipe →
              </a>
              <div className="ml-auto flex items-center gap-2">
                {!confirmingDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-red-300 hover:text-red-600"
                  >
                    Delete
                  </button>
                ) : (
                  <>
                    <span className="text-sm text-neutral-600">Delete forever?</span>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded-full border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => remove(detail.code)}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </div>
            {deleteError ? <p className="mt-3 text-sm text-red-600">{deleteError}</p> : null}
          </div>
        </div>
      )}
    </>
  );
}

/** One labelled row inside the past-meal detail modal. */
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
      <dt className="flex-none text-xs font-medium uppercase tracking-wide text-neutral-400 sm:w-24 sm:pt-0.5">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-neutral-700">{children}</dd>
    </div>
  );
}
