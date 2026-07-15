"use client";

/**
 * /reverse-lookup — the community dish catalog.
 * Three tabs (Dishes / Restaurants / Leaderboards) over one catalog fetch.
 * Search is token-AND across dish name, description, tags, ingredients,
 * restaurant name, and neighborhood. Voting is optimistic and reconciled
 * against the server's fresh cohort totals; all score math lives in
 * lib/reverse-lookup.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { sortDishCards, applyVote, groupByName, tokenize, dishMatchesTokens } from "@/lib/reverse-lookup";
import { DishCard, type CatalogDish } from "./components/DishCard";
import { RestaurantCard, type CatalogRestaurant } from "./components/RestaurantCard";
import { LeaderboardView } from "./components/LeaderboardView";
import { AddDishModal } from "./components/AddDishModal";

type Catalog = { city: string; restaurants: CatalogRestaurant[]; dishes: CatalogDish[] };
type Tab = "dishes" | "restaurants" | "leaderboards";

export default function ReverseLookupPage() {
  const { session, isAuthenticated } = useAuth();
  const accessToken = session?.accessToken ?? null;

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [tab, setTab] = useState<Tab>("dishes");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRestaurantId, setModalRestaurantId] = useState<string | null>(null);
  const [showAddGate, setShowAddGate] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const pendingJumpRef = useRef<string | null>(null);

  // The mount fetch (no token) and the post-hydration fetch (with token) can
  // resolve out of order; only the latest request may set state, or the
  // tokenless response would overwrite hydrated myVote data.
  const fetchSeqRef = useRef(0);

  const fetchCatalog = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    const isLatest = () => fetchSeqRef.current === seq;
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/eat-this/catalog?city=seattle", {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (!res.ok) throw new Error();
      const body: Catalog = await res.json();
      if (isLatest()) setCatalog(body);
    } catch {
      if (isLatest()) setLoadError(true);
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [accessToken]);

  // Fetch on mount, and refetch when auth changes so myVote hydrates.
  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  const dishes = catalog?.dishes ?? [];
  const restaurants = catalog?.restaurants ?? [];

  /** Tag vocabulary for the sticky pill row. */
  const tags = useMemo(() => {
    const seen = new Set<string>();
    for (const d of dishes) for (const t of d.tags) seen.add(t);
    return Array.from(seen).sort();
  }, [dishes]);

  const tokens = useMemo(() => tokenize(query), [query]);

  // Token-AND matching over the dish haystack (lib/reverse-lookup).
  const filteredDishes = useMemo(() => {
    return dishes.filter(
      (d) => (activeTag === "all" || d.tags.includes(activeTag)) && dishMatchesTokens(d, tokens)
    );
  }, [dishes, tokens, activeTag]);

  const sortedDishes = useMemo(() => {
    const sorted = sortDishCards(filteredDishes);
    // With a query active, same-named dishes at different venues sit together.
    return tokens.length > 0 ? groupByName(sorted) : sorted;
  }, [filteredDishes, tokens.length]);

  const filteredRestaurants = useMemo(() => {
    if (tokens.length === 0) return restaurants;
    return restaurants.filter((r) => {
      const haystack = [
        r.name,
        ...r.cuisines,
        ...r.locations.map((l) => l.neighborhood ?? ""),
      ].join(" ").toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [restaurants, tokens]);

  /** Switch to the Dishes tab, clear filters, scroll to a card and flash it. */
  const jumpToDish = useCallback((dishId: string) => {
    setTab("dishes");
    setQuery("");
    setActiveTag("all");
    setHighlightId(dishId);
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`dish-${highlightId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setHighlightId(null), 3500);
    return () => clearTimeout(timer);
  }, [highlightId, catalog]);

  // A freshly-added dish needs a refetch before it can be jumped to.
  useEffect(() => {
    const id = pendingJumpRef.current;
    if (id && dishes.some((d) => d.id === id)) {
      pendingJumpRef.current = null;
      jumpToDish(id);
    }
  }, [dishes, jumpToDish]);

  const onAdded = useCallback((dishId: string) => {
    pendingJumpRef.current = dishId;
    toast.success("Dish added — thanks for contributing!");
    fetchCatalog();
  }, [fetchCatalog]);

  // Rapid successive votes on one dish can resolve out of order; per-dish
  // sequence numbers make sure only the latest request reconciles (or
  // reverts) that dish's state.
  const voteSeqRef = useRef(new Map<string, number>());

  const onVote = useCallback(async (dishId: string, value: 1 | 0 | -1 | null, isLocal: boolean) => {
    const previous = catalog?.dishes.find((d) => d.id === dishId);
    if (!previous || !catalog) return;

    const seq = (voteSeqRef.current.get(dishId) ?? 0) + 1;
    voteSeqRef.current.set(dishId, seq);
    const isLatest = () => voteSeqRef.current.get(dishId) === seq;

    const patch = (fn: (d: CatalogDish) => CatalogDish) =>
      setCatalog((c) => c && { ...c, dishes: c.dishes.map((d) => (d.id === dishId ? fn(d) : d)) });

    // Optimistic: recompute cohort totals locally, reconcile below.
    patch((d) => applyVote(d, value, isLocal));

    try {
      const res = await fetch(`/api/eat-this/dishes/${dishId}/vote`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken ?? ""}`,
        },
        body: JSON.stringify({ value, isLocal }),
      });
      if (!isLatest()) return; // a newer vote owns this dish's state now
      if (res.status === 401) {
        patch(() => previous);
        setSessionExpired(true);
        return;
      }
      if (!res.ok) throw new Error();
      const body = await res.json();
      if (!isLatest()) return;
      patch((d) => ({ ...d, locals: body.locals, visitors: body.visitors, myVote: body.myVote }));
    } catch {
      if (!isLatest()) return;
      patch(() => previous);
      toast.error("Couldn't save your vote — try again.");
    }
  }, [catalog, accessToken]);

  const openAdd = (restaurantId: string | null) => {
    if (!isAuthenticated) { setShowAddGate(true); return; }
    setShowAddGate(false);
    setModalRestaurantId(restaurantId);
    setModalOpen(true);
  };

  const tabButton = (key: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        tab === key ? "bg-apb text-white" : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );

  const resultCount = tab === "restaurants" ? filteredRestaurants.length : sortedDishes.length;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      {/* Hero */}
      <header className="pt-8">
        <div className="text-[11px] font-bold tracking-wide text-apb">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-apb-accent align-middle" />
          Eat This! · Seattle
        </div>
        <h1 className="mt-1.5 text-2xl font-bold leading-snug text-neutral-900 sm:text-3xl">
          Tell us what you&rsquo;re craving — we&rsquo;ll tell you{" "}
          <em className="text-apb">where to find it 100% plant-based</em>.
        </h1>
        {/* Search drives the Dishes and Restaurants tabs; Leaderboards swaps it for the category picker. */}
        {tab !== "leaderboards" && (
        <label className="mt-4 flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-4 py-3 shadow-sm focus-within:border-apb">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-neutral-400"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "pad thai", "donut", "Ballard"…'
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
          {!loading && !loadError && (
            <span className="shrink-0 text-xs font-medium text-neutral-400">
              {resultCount} {tab === "restaurants"
                ? resultCount === 1 ? "spot" : "spots"
                : resultCount === 1 ? "dish" : "dishes"}
            </span>
          )}
        </label>
        )}
      </header>

      {/* Tabs + Add */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tabButton("dishes", `Dishes (${dishes.length})`)}
        {tabButton("restaurants", `Restaurants (${restaurants.length})`)}
        {tabButton("leaderboards", "Leaderboards")}
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => openAdd(null)}
            className="rounded-full bg-apb-accent px-4 py-1.5 text-sm font-bold text-white transition hover:bg-apb-accent-light"
          >
            + Add
          </button>
          {showAddGate && (
            <div className="absolute right-0 top-full z-40 mt-2 w-60 rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-600 shadow-lg">
              Sign in to add a dish — it takes a minute.{" "}
              <a className="font-semibold text-apb underline" href="/login?next=/eat-this">Sign in</a>
              <button
                type="button"
                onClick={() => setShowAddGate(false)}
                className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-600"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {sessionExpired && (
        <div className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Session expired, sign in again —{" "}
          <a className="font-semibold underline" href="/login?next=/eat-this">sign in</a> to keep voting.
        </div>
      )}

      {/* Sticky tag-pill row (Dishes tab), mirroring the /dishes sticky filter */}
      {tab === "dishes" && !loading && !loadError && tags.length > 0 && (
        <div className="sticky top-16 z-30 -mx-4 mt-4 border-b border-neutral-200/80 bg-apb-cream/95 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-[10px] font-bold tracking-wide text-neutral-400">CATEGORY</span>
            {["all", ...tags].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
                  activeTag === tag
                    ? "border-apb bg-apb text-white"
                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {tag === "all" ? "All" : tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="mt-5">
        {loading && !catalog ? (
          <div className="py-16 text-center text-sm text-neutral-500">Loading the catalog…</div>
        ) : loadError && !catalog ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="text-sm text-red-700">Couldn&rsquo;t load the catalog right now.</p>
            <button
              type="button"
              onClick={fetchCatalog}
              className="rounded-full bg-apb px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Retry
            </button>
          </div>
        ) : tab === "dishes" ? (
          <div className="flex flex-col gap-4">
            {sortedDishes.map((dish) => (
              <div
                key={dish.id}
                id={`dish-${dish.id}`}
                className={highlightId === dish.id ? "rounded-2xl ring-2 ring-apb-accent transition" : undefined}
              >
                <DishCard dish={dish} onVote={onVote} onChanged={fetchCatalog} />
              </div>
            ))}
            {sortedDishes.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
                <p className="text-sm text-neutral-600">
                  {dishes.length === 0
                    ? "Nothing here yet — know a great vegan dish? Add the first one!"
                    : "No dishes match. Try a broader search — or add what's missing!"}
                </p>
                <button
                  type="button"
                  onClick={() => openAdd(null)}
                  className="rounded-full bg-apb px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  + Add a dish
                </button>
              </div>
            )}
          </div>
        ) : tab === "restaurants" ? (
          <div className="flex flex-col gap-4">
            {filteredRestaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onAddDish={openAdd} />
            ))}
            {filteredRestaurants.length === 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-600">
                No restaurants match that search.
              </div>
            )}
          </div>
        ) : (
          <LeaderboardView dishes={dishes} />
        )}
      </div>

      <AddDishModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        restaurants={restaurants}
        dishes={dishes}
        initialRestaurantId={modalRestaurantId}
        onAdded={onAdded}
        onJumpToDish={jumpToDish}
      />
    </main>
  );
}
