"use client";

/**
 * Category leaderboards, ported from the style sample's LeaderboardPage.
 * Category pills come from leaderboardCategories() (tags with ≥2 rankable
 * dishes); rows come from rankLeaderboard() — all math lives in the lib.
 * #1 gets the CHAMP crown treatment. Rankings are computed live, client-side.
 */
import { useEffect, useMemo, useState } from "react";
import { CuteFace } from "./CuteFace";
import { ScoreBlock, FACE_FILLS } from "./YumMeter";
import { leaderboardCategories, rankLeaderboard, overallTotals, scorePct, tierFor } from "@/lib/eat-this";
import type { CatalogDish } from "./DishCard";

export function LeaderboardView({ dishes }: { dishes: CatalogDish[] }) {
  const categories = useMemo(() => leaderboardCategories(dishes), [dishes]);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Keep the selection valid as the catalog changes; default to the first category.
  useEffect(() => {
    if (activeTag === null || !categories.includes(activeTag)) {
      setActiveTag(categories[0] ?? null);
    }
  }, [categories, activeTag]);

  const ranked = useMemo(
    () => (activeTag ? rankLeaderboard(dishes, activeTag) : []),
    [dishes, activeTag]
  );

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
        <CuteFace mood="neutral" size={64} fill="#D6D3CE" />
        <p className="text-sm text-neutral-600">
          No leaderboards yet — dishes need 5 votes to rank. Get voting!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold tracking-wide text-neutral-400">CATEGORY</span>
        {categories.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
              activeTag === tag
                ? "border-apb bg-apb text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <ol className="mt-4 flex flex-col gap-3">
        {ranked.map((dish, idx) => {
          const tier = tierFor(scorePct(overallTotals(dish)));
          const isTop = idx === 0;
          return (
            <li
              key={dish.id}
              className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center ${
                isTop ? "border-apb/40 ring-2 ring-apb/20" : "border-neutral-200"
              }`}
            >
              <div className="flex w-12 shrink-0 flex-col items-center gap-1">
                <span className="text-xl font-extrabold text-neutral-800">{idx + 1}</span>
                {isTop && (
                  <span className="rounded-full bg-apb px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">
                    CHAMP
                  </span>
                )}
              </div>

              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl"
                style={{ background: tier.soft }}
              >
                <CuteFace mood={tier.face} size={52} fill={FACE_FILLS[tier.key]} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-neutral-900">{dish.name}</h3>
                <div className="text-xs text-neutral-600">
                  <strong className="font-semibold text-neutral-800">{dish.restaurantName}</strong>
                  {dish.location?.neighborhood && <span> · {dish.location.neighborhood}</span>}
                </div>
                {dish.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{dish.description}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:w-72 sm:flex-row">
                <ScoreBlock label="LOCALS" totals={dish.locals} />
                <ScoreBlock label="VISITORS" totals={dish.visitors} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
