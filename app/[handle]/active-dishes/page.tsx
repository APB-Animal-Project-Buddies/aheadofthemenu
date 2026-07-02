"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { normalizeHandle } from "@/lib/handle";

type ActiveDish = {
  code: string;
  reviewPath: string;
  name: string;
  difficulty: number | null;
  activeUntil: string;
  createdAt: string;
  dishId: number;
  dishName: string | null;
};

function timeLeft(activeUntil: string): string {
  const ms = new Date(activeUntil).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function ActiveDishesPage() {
  const params = useParams<{ handle: string }>();
  const handle = normalizeHandle(String(params.handle ?? ""));
  const { handle: myHandle, userId } = useAuth();
  const isOwner = !!myHandle && normalizeHandle(myHandle) === handle;

  const [dishes, setDishes] = useState<ActiveDish[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/active-dishes?handle=${encodeURIComponent(handle)}`);
      const data = await res.json();
      setDishes(Array.isArray(data.dishes) ? data.dishes : []);
    } finally {
      setLoading(false);
    }
  }, [handle]);

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

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-2xl font-semibold text-apb">@{handle}&rsquo;s active dishes</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Dishes open for review right now — each stays active for 24 hours.
      </p>

      {loading ? (
        <p className="mt-8 text-neutral-500">Loading…</p>
      ) : dishes.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          No active dishes right now.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {dishes.map((d) => (
            <li key={d.code} className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4">
              <div className="min-w-0">
                <div className="truncate font-medium text-neutral-900">{d.dishName ?? `Dish #${d.dishId}`}</div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  by {d.name} · <span className="text-amber-600">{timeLeft(d.activeUntil)}</span>
                </div>
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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
