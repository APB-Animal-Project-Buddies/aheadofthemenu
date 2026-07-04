"use client";

import { useCallback, useEffect, useState } from "react";
import { QrShareCard } from "@/components/QrShareCard";
import { useAuth } from "@/components/AuthProvider";

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
};

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
              <li key={d.code} className="px-4 py-3">
                <div className="truncate text-sm text-neutral-700">{d.dishName ?? `Dish #${d.dishId}`}</div>
                <div className="mt-0.5 text-xs text-neutral-400">
                  by {d.name} · {d.activeUntil ? `ended ${new Date(d.activeUntil).toLocaleDateString()}` : "never opened for review"}
                </div>
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
              <li key={d.code} className="px-4 py-3">
                <div className="truncate text-sm text-neutral-700">{d.dishName ?? `Dish #${d.dishId}`}</div>
                <div className="mt-0.5 text-xs text-neutral-400">
                  by {d.name} · {d.activeUntil ? `ended ${new Date(d.activeUntil).toLocaleDateString()}` : "never opened for review"}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
