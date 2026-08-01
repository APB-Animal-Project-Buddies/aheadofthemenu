"use client";

/**
 * /reverse-lookup — the community dish catalog.
 * Three tabs (Dishes / Restaurants / Leaderboards) over one catalog fetch.
 * Search is token-AND across dish name, description, tags, ingredients,
 * restaurant name, and neighborhood. Voting is optimistic and reconciled
 * against the server's fresh cohort totals; all score math lives in
 * lib/eat-this.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { sortDishCards, applyVote, groupByName, tokenize, dishMatchesTokens, type OrderType } from "@/lib/eat-this";
import { DishCard, type CatalogDish } from "./components/DishCard";
import { RestaurantCard, type CatalogRestaurant } from "./components/RestaurantCard";
import { LeaderboardView } from "./components/LeaderboardView";
import { AddDishModal } from "./components/AddDishModal";

type Catalog = { city: string; restaurants: CatalogRestaurant[]; dishes: CatalogDish[] };
type Tab = "dishes" | "restaurants" | "leaderboards";

/** Displays tag pills with overflow handling using a "+ more" button. */
function TagPillRow({
  tags,
  selectedTags,
  tagButton,
  onMoreClick,
  visibleCountRef,
}: {
  tags: string[];
  selectedTags: Set<string>;
  tagButton: (tag: string, isSelected: boolean) => React.ReactNode;
  onMoreClick: () => void;
  visibleCountRef: React.MutableRefObject<string[]>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tags.length);

  // `true` means "the next render shows every chip, so widths can be measured".
  //
  // This is STATE, not a ref, and that matters. Effects run layout-first then
  // passive, so on mount the measure pass below sets a fitted count and the
  // reset effect immediately puts it back to tags.length — the value it already
  // had. A ref-based flag would leave React bailing out of that no-op state
  // update, so no re-render, no second measure, and the row renders every chip
  // un-truncated forever. Flipping a state flag guarantees the re-render.
  const [needsMeasure, setNeedsMeasure] = useState(true);

  // Anything that changes the content restarts measurement from "show
  // everything", so the row can grow back. Without the reset a transient
  // squeeze — the Clear button appearing, a narrower window — costs a chip slot
  // permanently and the row ratchets down over a session.
  //
  // Guarded on the actual content rather than firing on mount. Effects run
  // layout-first then passive, so an unguarded reset runs right after the mount
  // measurement and puts visibleCount back to tags.length — the value it
  // already had. Both updates batch into a no-op, React bails out of the
  // re-render, and the row is stuck rendering every chip untruncated. Comparing
  // a content key also makes this idempotent under StrictMode's double-invoke.
  const measuredKey = useRef<string | null>(null);
  useEffect(() => {
    const key = `${selectedTags.size} ${tags.join(" ")}`;
    if (measuredKey.current === key) return;

    const isInitial = measuredKey.current === null;
    measuredKey.current = key;
    // On mount the initial state is already "show everything, needs measuring".
    if (isInitial) return;

    setNeedsMeasure(true);
    setVisibleCount(tags.length);
  }, [tags, selectedTags.size]);

  // Same reset on width changes, which is what makes the row respond to the
  // window being resized rather than only to tag/selection changes.
  //
  // Observe the PARENT, not the chip container. The container is a flex child
  // sized by its content, so dropping a chip changes its own width — observing
  // it would turn every shrink step into a resize, reset the count, and loop
  // forever. The parent's width is set by the page layout and is unaffected by
  // how many chips we render.
  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el || typeof ResizeObserver === "undefined") return;

    let lastWidth = el.offsetWidth;
    const ro = new ResizeObserver(() => {
      const width = el.offsetWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      setNeedsMeasure(true);
      setVisibleCount(tags.length);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tags]);

  // Measure in ONE pass rather than dropping a chip per render. Shrinking
  // iteratively from a full reset would need one render per hidden chip — with
  // ~57 tags that is ~51 nested updates, past React's limit of 50, which throws
  // "Maximum update depth exceeded" instead of settling.
  //
  // On the render where every chip is present we can read each width directly
  // and compute how many fit, so the row converges in a single extra render.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !needsMeasure) return;

    const available = el.offsetWidth;
    const chips = Array.from(el.children) as HTMLElement[];
    const GAP_PX = 8; // matches gap-2

    let used = 0;
    let fits = 0;
    for (const chip of chips) {
      const next = used + (fits > 0 ? GAP_PX : 0) + chip.offsetWidth;
      if (next > available) break;
      used = next;
      fits++;
    }

    // Overflowing means a "+ N more" pill has to fit too, so give up one chip
    // to make room for it.
    if (fits < chips.length) fits = Math.max(0, fits - 1);
    setNeedsMeasure(false);
    setVisibleCount(fits);
  });

  // Corrective pass for the rare case where the reserved slot still wasn't
  // enough (an unusually wide "+ N more" label). Bounded in practice to a step
  // or two because the measurement above already lands close.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || needsMeasure) return;
    if (el.scrollWidth > el.offsetWidth && visibleCount > 0) {
      setVisibleCount(visibleCount - 1);
    }
  });

  const visibleTags = tags.slice(0, visibleCount);
  const hiddenTags = tags.slice(visibleCount);
  const hasHidden = hiddenTags.length > 0;

  // The parent renders the overflow dropdown from this, so it has to track
  // every change, not just the shrink steps.
  useEffect(() => {
    visibleCountRef.current = visibleTags;
  });

  return (
    <div ref={containerRef} className="flex items-center gap-2 overflow-hidden">
      {visibleTags.map((tag) => tagButton(tag, selectedTags.has(tag)))}
      {hasHidden && (
        <button
          type="button"
          onClick={onMoreClick}
          className="shrink-0 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          + {hiddenTags.length} more
        </button>
      )}
    </div>
  );
}

export default function EatThisPage() {
  const { session, isAuthenticated } = useAuth();
  const accessToken = session?.accessToken ?? null;

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [tab, setTab] = useState<Tab>("dishes");
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRestaurantId, setModalRestaurantId] = useState<string | null>(null);
  const [showAddGate, setShowAddGate] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [tagQuery, setTagQuery] = useState("");
  const pendingJumpRef = useRef<string | null>(null);
  const visibleTagsRef = useRef<string[]>([]);

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

  // Filter tags based on tagQuery, with selected tags bubbled to the front.
  //
  // The hoist matters because the row is alphabetical and truncates into
  // "+ N more": search "tofu", select it, clear the search, and the tag drops
  // back to its alphabetical slot — usually hidden — so the filter narrowing
  // the list is invisible and can't be switched off without hunting for it.
  // Selected tags are also kept in the list even when they don't match the
  // current query, so an active filter is never hidden by an unrelated search.
  const filteredTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    const matches = q ? tags.filter((tag) => tag.toLowerCase().includes(q)) : tags;

    const selected: string[] = [];
    const rest: string[] = [];
    for (const tag of tags) if (selectedTags.has(tag)) selected.push(tag);
    for (const tag of matches) if (!selectedTags.has(tag)) rest.push(tag);

    return [...selected, ...rest];
  }, [tags, tagQuery, selectedTags]);

  // Token-AND matching over the dish haystack (lib/eat-this).
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      // If tags are selected, dish must include at least one selected tag
      if (selectedTags.size > 0 && !Array.from(selectedTags).some((tag) => d.tags.includes(tag))) {
        return false;
      }
      return dishMatchesTokens(d, tokens);
    });
  }, [dishes, tokens, selectedTags]);

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
    setSelectedTags(new Set());
    setHighlightId(dishId);
  }, []);

  useEffect(() => {
    if (!showMoreMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showMoreMenu]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const tagButton = (tag: string, isSelected: boolean) => (
    <button
      key={tag}
      type="button"
      onClick={() => toggleTag(tag)}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${isSelected
        ? "border-apb bg-apb text-white"
        : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
        }`}
    >
      {tag}
    </button>
  );

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

  const onVote = useCallback(async (dishId: string, value: 1 | 0 | -1 | null, isLocal: boolean, customizations: string[], orderType: OrderType) => {
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
        body: JSON.stringify({ value, isLocal, customizations, orderType }),
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
      patch((d) => ({ ...d, locals: body.locals, visitors: body.visitors, byCustomization: body.byCustomization ?? d.byCustomization, myVote: body.myVote }));
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
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === key ? "bg-apb text-white" : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
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
          <div className="mb-3 flex items-center gap-2">
            <span className="shrink-0 text-[10px] font-bold tracking-wide text-neutral-400">FIND CATEGORY</span>
            <input
              type="text"
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              placeholder="Search tags…"
              className="flex-1 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs outline-none placeholder:text-neutral-400 focus:border-apb"
            />
            {tagQuery && (
              <button
                type="button"
                onClick={() => setTagQuery("")}
                className="shrink-0 text-neutral-400 hover:text-neutral-600"
                aria-label="Clear tag search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-[10px] font-bold tracking-wide text-neutral-400">CATEGORY</span>
            {selectedTags.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags(new Set())}
                className="shrink-0 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Clear
              </button>
            )}
            <TagPillRow
              tags={filteredTags}
              selectedTags={selectedTags}
              tagButton={tagButton}
              onMoreClick={() => setShowMoreMenu(true)}
              visibleCountRef={visibleTagsRef}
            />
            {showMoreMenu && filteredTags.length > 0 && (
              <div
                ref={moreMenuRef}
                className="absolute right-4 top-full z-50 mt-2 flex max-h-60 flex-col gap-2 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-3 shadow-lg"
              >
                {visibleTagsRef.current && filteredTags
                  .slice(visibleTagsRef.current.length)
                  .map((tag) => tagButton(tag, selectedTags.has(tag)))}
              </div>
            )}
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