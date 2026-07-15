"use client";

/**
 * One dish at one restaurant. Information order mirrors the old static card:
 * header (name, tag pill, "from RESTAURANT · neighborhood", verified badge),
 * Yum Meter, description, flavors / key ingredients / allergens rows from the
 * details jsonb, then address + website footer, the vote widget, and
 * community attribution.
 */
import { useState } from "react";
import type { VoteTotals } from "@/lib/reverse-lookup";
import { YumMeter } from "./YumMeter";
import { VoteWidget, type MyVote } from "./VoteWidget";
import { DishPhotos, type DishPhoto } from "./DishPhotos";
import { DishComments, type DishComment } from "./DishComments";
import { ReportDishModal } from "./ReportDishModal";

export type CatalogDish = {
  id: string; restaurantId: string; restaurantName: string; verified: boolean;
  website: string | null;
  location: { address: string; neighborhood: string | null } | null;
  name: string; description: string | null; tags: string[];
  details: { ingredients?: string[]; allergens?: Array<{ name: string; optional?: boolean }>; flavors?: string[] };
  availability: "permanent" | "seasonal";
  createdAt: string; addedBy: string | null;
  locals: VoteTotals; visitors: VoteTotals; myVote: MyVote;
  photos: DishPhoto[]; comments: DishComment[];
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-28 shrink-0 text-[10px] font-bold tracking-wide text-neutral-400">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function DishCard({ dish, onVote }: {
  dish: CatalogDish;
  onVote: (dishId: string, value: 1 | 0 | -1 | null, isLocal: boolean) => void;
}) {
  const { details } = dish;
  const [reportOpen, setReportOpen] = useState(false);
  const flavors = details?.flavors ?? [];
  const ingredients = details?.ingredients ?? [];
  const allergens = details?.allergens ?? [];

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold leading-snug text-neutral-900">{dish.name}</h2>
          <div className="mt-0.5 text-sm text-neutral-600">
            <span className="text-neutral-400">from</span>{" "}
            <strong className="font-semibold text-neutral-800">{dish.restaurantName}</strong>
            {dish.location?.neighborhood && <span> · {dish.location.neighborhood}</span>}
            {dish.verified && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-apb/10 px-1.5 py-0.5 text-[10px] font-semibold text-apb align-middle">
                verified ✓
              </span>
            )}
            {dish.availability === "seasonal" && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 align-middle">
                🍂 Seasonal
              </span>
            )}
          </div>
        </div>
        {dish.tags[0] && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-neutral-500">
            {dish.tags[0].toUpperCase()}
          </span>
        )}
      </header>

      <div className="mt-3">
        <YumMeter locals={dish.locals} visitors={dish.visitors} />
      </div>

      {dish.description && <p className="mt-3 text-sm leading-relaxed text-neutral-700">{dish.description}</p>}

      {(flavors.length > 0 || ingredients.length > 0 || allergens.length > 0) && (
        <div className="mt-3 flex flex-col gap-2">
          {flavors.length > 0 && (
            <DetailRow label="FLAVORS">
              {flavors.map((f) => (
                <span key={f} className="rounded-full bg-apb/10 px-2 py-0.5 text-[11px] font-medium text-apb">{f}</span>
              ))}
            </DetailRow>
          )}
          {ingredients.length > 0 && (
            <DetailRow label="KEY INGREDIENTS">
              {ingredients.map((i) => (
                <span key={i} className="rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600">{i}</span>
              ))}
            </DetailRow>
          )}
          {allergens.length > 0 && (
            <DetailRow label="ALLERGENS">
              {allergens.map((a) => (
                <span key={a.name} className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                  {a.name}
                  {a.optional && <span className="ml-1 text-[9px] font-bold tracking-wide text-red-400">OPTIONAL</span>}
                </span>
              ))}
            </DetailRow>
          )}
        </div>
      )}

      {(dish.location || dish.website) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
          {dish.location && (
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {dish.location.address}
            </span>
          )}
          {dish.website && (
            <a href={dish.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-apb hover:underline">
              ↗ website
            </a>
          )}
        </div>
      )}

      <VoteWidget myVote={dish.myVote} onVote={(value, isLocal) => onVote(dish.id, value, isLocal)} />

      <DishPhotos dishId={dish.id} photos={dish.photos} />

      <DishComments dishId={dish.id} comments={dish.comments} />

      <div className="mt-3 flex items-center justify-between gap-3">
        {dish.addedBy ? (
          <div className="text-[11px] text-neutral-400">added by @{dish.addedBy}</div>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="text-[11px] text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline"
        >
          Is this still on the menu? · Report a problem
        </button>
      </div>

      <ReportDishModal dishId={dish.id} open={reportOpen} onClose={() => setReportOpen(false)} />
    </article>
  );
}
