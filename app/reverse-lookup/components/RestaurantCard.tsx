"use client";

/**
 * Directory card for one venue: cuisine pills, description, a 📍 line per
 * location, website/instagram links, dish count — and the contribution hook:
 * "Know their menu? + Add a dish" opens the add modal pre-selected here.
 */
export type CatalogRestaurant = {
  id: string;
  name: string;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  description: string | null;
  cuisines: string[];
  verified: boolean;
  locations: Array<{ id: string; address: string; neighborhood: string | null; phone: string | null }>;
  dishCount: number;
};

export function RestaurantCard({ restaurant, onAddDish }: {
  restaurant: CatalogRestaurant;
  onAddDish: (restaurantId: string) => void;
}) {
  const r = restaurant;
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold leading-snug text-neutral-900">
            {r.name}
            {r.verified && (
              <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-apb/10 px-1.5 py-0.5 text-[10px] font-semibold text-apb align-middle">
                verified ✓
              </span>
            )}
          </h2>
          {r.cuisines.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {r.cuisines.map((c) => (
                <span key={c} className="rounded-full bg-apb/10 px-2 py-0.5 text-[11px] font-medium text-apb">{c}</span>
              ))}
            </div>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-neutral-500">
          {r.dishCount} {r.dishCount === 1 ? "DISH" : "DISHES"}
        </span>
      </header>

      {r.description && <p className="mt-2.5 text-sm leading-relaxed text-neutral-700">{r.description}</p>}

      {r.locations.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-1 text-xs text-neutral-500">
          {r.locations.map((loc) => (
            <span key={loc.id} className="inline-flex items-baseline gap-1">
              <span aria-hidden>📍</span>
              <span>
                {loc.address}
                {loc.neighborhood && <span className="text-neutral-400"> · {loc.neighborhood}</span>}
              </span>
            </span>
          ))}
        </div>
      )}

      {(r.website || r.instagram) && (
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {r.website && (
            <a href={r.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-apb hover:underline">
              ↗ website
            </a>
          )}
          {r.instagram && (
            <a
              href={/^https?:\/\//i.test(r.instagram) ? r.instagram : `https://instagram.com/${r.instagram.replace(/^@/, "")}`}
              target="_blank" rel="noopener noreferrer"
              className="font-semibold text-apb hover:underline"
            >
              ↗ instagram
            </a>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-neutral-100 pt-3">
        <span className="text-xs text-neutral-500">Know their menu?</span>
        <button
          type="button"
          onClick={() => onAddDish(r.id)}
          className="rounded-full border border-apb px-3 py-1 text-xs font-semibold text-apb transition hover:bg-apb hover:text-white"
        >
          + Add a dish
        </button>
      </div>
    </article>
  );
}
