"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useDishes } from "@/app/hooks/useDishes";
import './styles.css';
import {
  SearchBox, FilterChips, CuisineBar, Toolbar,
  DishCard, DishModal, MenuDrawer, Toast,
} from './components';
import { CUISINE_META } from './helpers';
import { LoadingFacts, PLANT_FACTS, pickWeighted, TipCard } from './LoadingFacts';
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
  const { dishes: dishRows, loading, error } = useDishes() || { dishes: [], loading: false, error: null };

  // Extract dish_data from API response (API returns { id, dish_name, dish_data, created_at })
  const dishes = dishRows.map(d => ({
    ...d.dish_data,
    _id: d.id,  // Add the database ID with underscore to avoid conflicts
  }));

  // ---------- UI state ----------
  // Deep-link: open dish modal when URL hash is `#r=<dish-id>`
  useEffect(() => {
    const m = window.location.hash.match(/^#r=(.+)$/);
    if (!m || !dishes || dishes.length === 0) return;
    const target = dishes.find(r => r.id === m[1]);
    if (target) openDish(target);
  }, [dishes]);

  const [activeCuisine, setActiveCuisine] = useState('all');
  const [sortBy, setSortBy] = useState('curated');
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [sourcingFilter, setSourcingFilter] = useState('all');
  const [tagFilters, setTagFilters] = useState([]);
  const [dietFilters, setDietFilters] = useState([]);

  // ---------- Saved + menu state (persisted) ----------
  const stored = loadStoredMenu();
  const [saved, setSaved] = useState(new Set(stored?.saved || []));
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
      saved: Array.from(saved),
      menu,
      menuName,
      servings,
    });
  }, [saved, menu, menuName, servings]);

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
      if (activeCuisine !== 'all' && !(r.cuisines || []).includes(activeCuisine)) return false;
      if (courseFilter !== 'all' && !(r.courses || []).includes(courseFilter)) return false;
      if (sourcingFilter === 'in-house' && r.sourcingTier !== 'in-house') return false;
      if (sourcingFilter === 'branded' && r.sourcingTier === 'in-house') return false;
      if (tagFilters.length > 0 && !tagFilters.every(t => (r.tags || []).includes(t))) return false;
      if (dietFilters.length > 0 && dietFilters.some(d => (r.allergens || []).includes(d))) return false;
      if (q) {
        const hay = `${r.title || ''} ${(r.cuisines || []).join(' ')} ${r.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sortBy === 'time') {
      list = [...list].sort((a, b) => parseTime(a.time) - parseTime(b.time));
    } else if (sortBy === 'cost') {
      list = [...list].sort((a, b) => (a.cost ?? 99) - (b.cost ?? 99));
    } else if (sortBy === 'easy') {
      list = [...list].sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));
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
  }, [dishes, activeCuisine, sortBy, search, courseFilter, sourcingFilter, tagFilters, dietFilters]);

  // ---------- Featured (Pick of the week) ----------
  // ---------- Toasts + actions ----------
  function showToast(msg) {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 1800);
  }

  function toggleSave(id) {
    setSaved(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); showToast('Removed from saved'); }
      else { n.add(id); showToast('Saved'); }
      return n;
    });
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

  function openDish(dish) {
    setModalDish(dish);
    setModalOpen(true);
  }

  function closeDish() {
    setModalOpen(false);
    setTimeout(() => setModalDish(null), 220);
  }

  function toggleTag(tag) {
    setTagFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function toggleDiet(d) {
    setDietFilters(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  // Keep the loading screen up for at least 2s so the branded screen doesn't
  // flash, even when dishes load instantly.
  const [minTimePassed, setMinTimePassed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Single rotating tip toast (sonner, root <Toaster/>): a random tip is picked
  // on mount, shown during loading, kept — updated in place, so it never re-pops —
  // into the loaded page, then dismissed 5s after load.
  const tipIdx = useRef(null);
  const tipActive = loading || !minTimePassed;
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
  if (loading || !minTimePassed) {
    return <LoadingFacts />;
  }

  if (error) {
    return (
      <div className="empty-state">
        <h3>Error loading dishes</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!dishes || dishes.length === 0) {
    return (
      <div className="empty-state">
        <h3>Dish data missing</h3>
        <p>The dish library failed to load.</p>
      </div>
    );
  }

  const cuisineMeta = (typeof window !== 'undefined' && CUISINE_META) || [];

  const activeName = activeCuisine === 'all'
    ? 'The whole library'
    : (cuisineMeta.find(c => c.id === activeCuisine)?.name + ' kitchen');

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
        <div className="filter-row">
          <SearchBox value={search} onChange={setSearch} placeholder="Search dishes…" />
          {FilterChips && (
            <FilterChips
              activeCourse={courseFilter}
              onCourseChange={setCourseFilter}
              activeSourcing={sourcingFilter}
              onSourcingChange={setSourcingFilter}
              activeTags={tagFilters}
              onTagToggle={toggleTag}
              activeDiets={dietFilters}
              onDietToggle={toggleDiet}
            />
          )}
        </div>
        {CuisineBar && (
          <CuisineBar active={activeCuisine} onChange={setActiveCuisine} counts={counts} />
        )}
        {Toolbar && (
          <Toolbar
            count={visible.length}
            activeName={activeName}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}
        {visible.length === 0 ? (
          <div className="empty-state">
            <h3>No dishes match those filters.</h3>
            <p>Try clearing search, course, or sourcing — or pick a different cuisine.</p>
          </div>
        ) : (
          <main className="dishes">
            {visible.map(r => (
              DishCard && (
                <DishCard
                  key={r.id}
                  dish={r}
                  saved={saved.has(r.id)}
                  inMenu={menu.some(it => it.id === r.id)}
                  onToggleSave={toggleSave}
                  onAddToMenu={addToMenu}
                  onOpen={openDish}
                />
              )
            ))}
          </main>
        )}
      </>

      <footer className="foot">
        Animal Project Buddies · Dishs are free to use, share, and adapt for your kitchen ·
        Source dishes are linked to their authors. Found an issue?{' '}
        <a href="mailto:hello@animalprojectbuddies.com?subject=Dishes feedback" style={{ color: 'var(--moss)' }}>Email us</a>.
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
