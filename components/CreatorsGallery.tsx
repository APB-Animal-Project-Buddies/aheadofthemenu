"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { GalleryCreator } from "@/lib/creators";

export function CreatorsGallery({ creators }: { creators: GalleryCreator[] }) {
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState<string | null>(null);

  // Cuisines present across the gallery, ranked by how many creators cover them.
  const cuisines = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of creators) for (const cu of c.cuisines) counts.set(cu, (counts.get(cu) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c);
  }, [creators]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creators.filter((c) => {
      if (cuisine && !c.cuisines.includes(cuisine)) return false;
      if (!q) return true;
      return (
        c.display_name.toLowerCase().includes(q) ||
        (c.creator_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [creators, query, cuisine]);

  return (
    <div>
      {/* Search */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search creators…"
        className="w-full rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm outline-none transition focus:border-apb"
      />

      {/* Cuisine filter */}
      {cuisines.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCuisine(null)}
            className={
              !cuisine
                ? "rounded-full bg-apb px-3.5 py-1.5 text-sm font-semibold text-white"
                : "rounded-full border border-neutral-200 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-neutral-600 transition hover:border-apb"
            }
          >
            All
          </button>
          {cuisines.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCuisine(cuisine === c ? null : c)}
              className={
                cuisine === c
                  ? "rounded-full bg-apb px-3.5 py-1.5 text-sm font-semibold text-white"
                  : "rounded-full border border-neutral-200 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-neutral-600 transition hover:border-apb"
              }
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      <p className="mt-4 text-sm text-neutral-400">
        {filtered.length} creator{filtered.length === 1 ? "" : "s"}
        {cuisine ? ` · ${cuisine}` : ""}
      </p>

      {/* Grid */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/creators/${c.slug}`}
            className="group flex flex-col items-center rounded-[16px] border border-neutral-200 bg-white/60 p-4 text-center transition hover:border-apb hover:shadow-sm"
          >
            {c.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.image_url}
                alt={c.display_name}
                className="h-20 w-20 rounded-full border border-neutral-200 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-neutral-200 bg-apb/10 text-2xl font-bold text-apb">
                {c.display_name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="mt-3 line-clamp-2 text-sm font-semibold text-neutral-800 group-hover:text-apb">
              {c.display_name}
            </div>
            {c.dishCount ? (
              <div className="mt-0.5 text-xs text-neutral-400">
                {c.dishCount} recipe{c.dishCount === 1 ? "" : "s"}
              </div>
            ) : null}
            {c.cuisines.length ? (
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {c.cuisines.slice(0, 3).map((cu) => (
                  <span key={cu} className="rounded-full bg-apb-cream px-2 py-0.5 text-[11px] font-medium text-apb">
                    {cu}
                  </span>
                ))}
              </div>
            ) : null}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-neutral-400">No creators match your search.</p>
      ) : null}
    </div>
  );
}
