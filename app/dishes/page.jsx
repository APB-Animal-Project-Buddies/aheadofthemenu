"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDishes } from "@/app/hooks/useDishes";
import { useCreatorsStore } from "@/app/stores/creators";
import './styles.css';
import {
  SearchBox, FilterChips, CuisineBar, Toolbar,
  DishCard, DishModal, MenuDrawer, Toast,
} from './components';
import { CUISINE_META } from './helpers';
// LoadingFacts (the full-screen branded screen) is no longer rendered here —
// the page shows a skeleton grid instead. The tip toast still uses the facts.
import { PLANT_FACTS, pickWeighted, TipCard } from './LoadingFacts';
import { toast as sonnerToast } from 'sonner';

const STORAGE_KEY = 'apb-dishes-menu-v1';

function loadStoredMenu() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveStoredMenu(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { }
}

export default function DishesPage() {
  // ---------- Data from API ----------
  // Fetch the whole library (API caps at 1000). Search/filter/sort all run
  // client-side over this full set, so nothing else needs to change. Revisit
  // with server-side pagination + search once the catalog approaches ~1000.
  const { dishes: dishRows, loading, error } = useDishes({ limit: 1000 }) || { dishes: [], loading: false, error: null };

  // Extract dish_data from API response (API returns { id, dish_name, dish_data, created_at })
  // and normalize the field names the sort/filter code reads: dish_data stores
  // prepTime / dishType / cost-as-string, but sorts read time / courses / numeric cost.
  const dishes = dishRows.map(d => {
    const dd = d.dish_data || {};
    const cost = typeof dd.cost === 'number' ? dd.cost : (parseFloat(dd.cost) || undefined);
    return {
      ...dd,
      _id: d.id,  // database ID with underscore to avoid conflicts
      time: dd.time ?? dd.prepTime,
      courses: (Array.isArray(dd.courses) && dd.courses.length ? dd.courses : dd.dishType) || [],
      cost,
    };
  });

  // ---------- UI state ----------
  // Deep-link: open dish modal when URL hash is `#r=<dish-id>`
  useEffect(() => {
    const m = window.location.hash.match(/^#r=(.+)$/);
    if (!m || !dishes || dishes.length === 0) return;
    const target = dishes.find(r => r.id === m[1]);
    if (target) openDish(target);
  }, [dishes]);

  const [activeCuisines, setActiveCuisines] = useState([]);
  const [cuisineQuery, setCuisineQuery] = useState('');
  const [sortBy, setSortBy] = useState('curated');
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  // An ARRAY, not a string. FilterChips has always contained multi-select logic
  // (and renders checkboxes in the creator dropdown), but its
  // `Array.isArray(activeCreator)` branch was unreachable while this was the
  // string 'all' — so picking a second creator silently replaced the first.
  // Empty array means "no creator filter".
  const [creatorFilter, setCreatorFilter] = useState([]);
  // Sourcing filter UI is parked for now; the state stays so the filter logic
  // below keeps working when the chips come back.
  const [sourcingFilter] = useState('all');
  const [tagFilters, setTagFilters] = useState([]);
  const [dietFilters, setDietFilters] = useState([]);

  // ---------- Menu state (persisted) ----------
  const stored = loadStoredMenu();
  const [menu, setMenu] = useState(stored?.menu || []);
  const [menuName, setMenuName] = useState(stored?.menuName || 'Spring tasting menu');
  const [servings, setServings] = useState(stored?.servings || 40);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalDish, setModalDish] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', show: false });

  // Persist menu state
  useEffect(() => {
    saveStoredMenu({
      menu,
      menuName,
      servings,
    });
  }, [menu, menuName, servings]);

  // Warm the shared creators cache (Zustand) — one /api/creators fetch per
  // session, shared with the recipe form's autocomplete.
  const loadCreators = useCreatorsStore(s => s.load);
  useEffect(() => { loadCreators(); }, [loadCreators]);

  // Creator filter chips: only creators that actually have dishes here are
  // filterable, so derive from the loaded dishes (originalCreator free text).
  const creatorOptions = useMemo(() => {
    const names = new Set();
    for (const r of (dishes || [])) if (r.originalCreator) names.add(r.originalCreator);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [dishes]);

  // ---------- Derived: cuisine counts ----------
  const counts = useMemo(() => {
    if (!dishes) return { all: 0 };
    const c = { all: dishes.length };
    for (const r of dishes) {
      for (const cuisine of (r.cuisines || [])) {
        c[cuisine] = (c[cuisine] || 0) + 1;
      }
    }
    return c;
  }, [dishes]);

  // ---------- Derived: filtered + sorted dishes ----------
  const visible = useMemo(() => {
    if (!dishes) return [];
    const q = search.trim().toLowerCase();
    let list = dishes.filter(r => {
      // OR across selected cuisines — several cuisines widen the results
      if (activeCuisines.length > 0 && !activeCuisines.some(c => (r.cuisines || []).includes(c))) return false;
      if (courseFilter !== 'all' && !(r.courses || []).includes(courseFilter)) return false;
      // OR across selected creators — several creators widen the results.
      if (creatorFilter.length > 0 && !creatorFilter.includes(r.originalCreator || '')) return false;
      if (sourcingFilter === 'in-house' && r.sourcingTier !== 'in-house') return false;
      if (sourcingFilter === 'branded' && r.sourcingTier === 'in-house') return false;
      if (tagFilters.length > 0 && !tagFilters.every(t => (r.tags || []).includes(t))) return false;
      if (dietFilters.length > 0 && dietFilters.some(d => (r.allergens || []).includes(d))) return false;
      if (q) {
        // Search across the recipe's title, cuisines, description, ingredient
        // names, creator, and tags so "chickpea", "Nora Cooks", or a tag all
        // find matching recipes — not just the title.
        const ingredientNames = (r.ingredients || []).map(i => i?.name || '').join(' ');
        const hay = [
          r.title, (r.cuisines || []).join(' '), r.description,
          ingredientNames, r.originalCreator, (r.tags || []).join(' '),
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sortBy === 'time') {
      list = [...list].sort((a, b) => parseTime(a.time) - parseTime(b.time));
    } else if (sortBy === 'cost') {
      list = [...list].sort((a, b) => (a.cost ?? 99) - (b.cost ?? 99));
    } else {
      // 'curated' — showstoppers first, then mains, then desserts/starters
      const order = { showstopper: 0, main: 1, starter: 2, dessert: 3 };
      list = [...list].sort((a, b) => {
        const ac = (a.courses && a.courses[0]) || 'main';
        const bc = (b.courses && b.courses[0]) || 'main';
        return (order[ac] ?? 5) - (order[bc] ?? 5);
      });
    }
    return list;
  }, [dishes, activeCuisines, sortBy, search, courseFilter, creatorFilter, sourcingFilter, tagFilters, dietFilters]);

  // ---------- Featured (Pick of the week) ----------
  // ---------- Toasts + actions ----------
  function showToast(msg) {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 1800);
  }

  function addToMenu(dish) {
    setMenu(prev => {
      const found = prev.find(it => it.id === dish.id);
      if (found) {
        showToast('Already in your menu');
        return prev;
      }
      showToast(`${dish.title} added`);
      return [...prev, { ...dish, qty: 1 }];
    });
  }

  function changeQty(id, qty) {
    setMenu(prev => prev.map(it => it.id === id ? { ...it, qty } : it));
  }

  function removeFromMenu(id) {
    setMenu(prev => prev.filter(it => it.id !== id));
  }

  const router = useRouter();
  const pathname = usePathname();
  // This page is served at both /dishes (consumer) and /recipes (business). A
  // dish page isn't pinned to either side, so when we came in via /recipes carry
  // the mode explicitly instead of relying on the nav's remembered session mode —
  // otherwise the bar can flash (or, with storage disabled, flip) to consumer.
  const modeHash = pathname?.startsWith("/recipes") ? "#business" : "";

  // Clicking a dish card navigates straight to the full dish page. The DishModal
  // popup is dropped for now — it stays defined and wired to the #r= deep-link
  // below, so restoring it is just swapping this back to `openDish`.
  function goToDish(dish) {
    if (!dish?._id) return;
    router.push(`/dishes/${dish._id}${modeHash}`);
  }

  function openDish(dish) {
    setModalDish(dish);
    setModalOpen(true);
  }

  function closeDish() {
    setModalOpen(false);
    setTimeout(() => setModalDish(null), 220);
  }

  function toggleCuisine(cuisine) {
    if (cuisine === null) {
      // "All" button clicked - clear all selections
      setActiveCuisines([]);
    } else {
      // Regular cuisine toggled
      setActiveCuisines(prev => prev.includes(cuisine) ? prev.filter(c => c !== cuisine) : [...prev, cuisine]);
    }
  }

  function toggleTag(tag) {
    setTagFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function toggleDiet(d) {
    setDietFilters(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  // There used to be a 2s minimum on the branded loading screen so it wouldn't
  // "flash" — which meant waiting a full two seconds even when the library was
  // already in hand. The page now renders immediately and shows a skeleton in
  // the grid, so there is no full-screen takeover to protect from flashing.

  // Single rotating tip toast (sonner, root <Toaster/>): a random tip is picked
  // on mount, shown during loading, kept — updated in place, so it never re-pops —
  // into the loaded page, then dismissed 5s after load.
  const tipIdx = useRef(null);
  const tipActive = loading;
  useEffect(() => {
    const id = "aotm-tip";
    if (tipIdx.current === null) tipIdx.current = pickWeighted();
    const show = () =>
      sonnerToast.custom(() => <TipCard text={PLANT_FACTS[tipIdx.current].t} />, {
        id,
        duration: Infinity,
        unstyled: true,
      });
    show();
    if (tipActive) {
      const rot = setInterval(() => {
        tipIdx.current = pickWeighted(tipIdx.current);
        show();
      }, 8000);
      return () => clearInterval(rot);
    }
    const done = setTimeout(() => sonnerToast.dismiss(id), 5000);
    return () => clearTimeout(done);
  }, [tipActive]);

  // ---------- Render gating ----------
  if (error) {
    return (
      <div className="empty-state">
        <h3>Error loading dishes</h3>
        <p>{error}</p>
      </div>
    );
  }

  // Only a genuine miss — an empty library AFTER loading finished — is an error.
  // While loading, fall through and render the page with a skeleton grid.
  if (!loading && (!dishes || dishes.length === 0)) {
    return (
      <div className="empty-state">
        <h3>Dish data missing</h3>
        <p>The dish library failed to load.</p>
      </div>
    );
  }

  const cuisineMeta = (typeof window !== 'undefined' && CUISINE_META) || [];

  const activeName = activeCuisines.length === 0
    ? 'The whole library'
    : activeCuisines.length === 1
      ? (cuisineMeta.find(c => c.id === activeCuisines[0])?.name + ' kitchen')
      : `${activeCuisines.length} cuisines`;

  return (
    <>
      <>
        <div className="dishes-topbar">
          <div className="eyebrow"><span className="dot" />Dish library</div>
          <a href="/submit-dish" className="submit-dish-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Submit a dish
          </a>
        </div>
        {/* Sticky filter section */}
        <div className="sticky-filter-header">
          <div className="filter-row-horizontal">
            <SearchBox value={search} onChange={setSearch} placeholder="Search by name, ingredient, creator…" />
            {FilterChips && (
              <FilterChips
                activeCourse={courseFilter}
                onCourseChange={setCourseFilter}
                activeCreator={creatorFilter}
                onCreatorChange={setCreatorFilter}
                creatorOptions={creatorOptions}
                activeTags={tagFilters}
                onTagToggle={toggleTag}
                activeDiets={dietFilters}
                onDietToggle={toggleDiet}
              />
            )}
          </div>
          {CuisineBar && (
            <div className="cuisine-row">
              <CuisineBar
                activeCuisines={activeCuisines}
                cuisineQuery={cuisineQuery}
                onCuisineChange={toggleCuisine}
                onQueryChange={setCuisineQuery}
                counts={counts}
              />
            </div>
          )}
        </div>
        {Toolbar && (
          <Toolbar
            count={visible.length}
            activeName={activeName}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}
        {loading ? (
          // Skeleton in place of the old full-screen branded screen: the page
          // chrome (search, filters, cuisines) is usable immediately, and only
          // the grid is pending. Nothing here shifts when the real cards land.
          <main className="dishes" aria-busy="true" aria-label="Loading dishes">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="dish-skeleton" aria-hidden="true">
                <div className="dish-skeleton-img skeleton-shimmer" />
                <div className="dish-skeleton-line skeleton-shimmer" />
                <div className="dish-skeleton-line short skeleton-shimmer" />
              </div>
            ))}
          </main>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <h3>No dishes match those filters.</h3>
            <p>Try clearing search or course — or pick a different cuisine.</p>
          </div>
        ) : (
          <main className="dishes">
            {visible.map(r => (
              DishCard && (
                <DishCard
                  key={r.id}
                  dish={r}
                  inMenu={menu.some(it => it.id === r.id)}
                  onAddToMenu={addToMenu}
                  onOpen={goToDish}
                />
              )
            ))}
          </main>
        )}
      </>

      <footer className="foot">
        Ahead of the Menu · Dishes are free to use, share, and adapt for your kitchen ·
        Source dishes are linked to their authors. Found an issue?{' '}
        <a href="mailto:aheadofthemenu@gmail.com?subject=Dishes feedback" style={{ color: 'var(--moss)' }}>Email us</a>.
      </footer>

      <MenuDrawer
        open={drawerOpen}
        items={menu}
        onClose={() => setDrawerOpen(false)}
        onChangeQty={changeQty}
        onRemove={removeFromMenu}
        menuName={menuName}
        setMenuName={setMenuName}
        servings={servings}
        setServings={setServings}
      />
      <DishModal
        dish={modalDish}
        open={modalOpen}
        onClose={closeDish}
        onAddToMenu={addToMenu}
        inMenu={modalDish ? menu.some(it => it.id === modalDish.id) : false}
      />
      <Toast message={toast.msg} show={toast.show} />
    </>
  );
}

// Time parser for sort: "30m" → 30, "4h" → 240, "3d" → 4320
function parseTime(t) {
  if (!t) return 99999;
  const m = String(t).match(/(\d+)\s*(m|h|d)/i);
  if (!m) return 99999;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  if (u === 'h') return n * 60;
  if (u === 'd') return n * 60 * 24;
  return n;
}