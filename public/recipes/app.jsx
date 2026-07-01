// Main app: fetches per-cuisine recipe JSON + dairy JSON, manages all state,
// composes the page. Persists menu state to localStorage.

const { useState, useEffect, useMemo } = React;

const STORAGE_KEY = 'apb-recipes-menu-v1';

function loadStoredMenu() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveStoredMenu(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function App() {
  // ---------- Data (read directly from window globals — populated by data/*.js script tags) ----------
  const recipes = window.APB_RECIPES || [];
  const index = window.APB_INDEX || null;
  const dairy = window.APB_DAIRY || null;

  // ---------- UI state ----------
  // Recipes-only page now — dairy lives at /top-dairy-products.

  // Open recipe modal directly when URL hash is `#r=<recipe-id>` (deep-link from tips page).
  useEffect(() => {
    const m = window.location.hash.match(/^#r=(.+)$/);
    if (!m || !recipes || recipes.length === 0) return;
    const target = recipes.find(r => r.id === m[1]);
    if (target) openRecipe(target);
  }, [recipes]);
  const [activeCuisine, setActiveCuisine] = useState('all');
  const [sortBy, setSortBy] = useState('curated');
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [sourcingFilter, setSourcingFilter] = useState('all');
  const [tagFilters, setTagFilters] = useState([]);
  // Dietary filters — each entry is an allergen id (gluten/nuts/soy/coconut).
  // A recipe is hidden if any of its r.allergens matches a selected diet filter.
  const [dietFilters, setDietFilters] = useState([]);

  // ---------- Saved + menu state (persisted) ----------
  const stored = loadStoredMenu();
  const [saved, setSaved] = useState(new Set(stored?.saved || []));
  const [menu, setMenu] = useState(stored?.menu || []);
  const [menuName, setMenuName] = useState(stored?.menuName || 'Spring tasting menu');
  const [servings, setServings] = useState(stored?.servings || 40);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalRecipe, setModalRecipe] = useState(null);
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
    if (!recipes) return { all: 0 };
    const c = { all: recipes.length };
    for (const r of recipes) c[r.cuisine] = (c[r.cuisine] || 0) + 1;
    return c;
  }, [recipes]);

  // ---------- Derived: filtered + sorted recipes ----------
  const visible = useMemo(() => {
    if (!recipes) return [];
    const q = search.trim().toLowerCase();
    let list = recipes.filter(r => {
      if (activeCuisine !== 'all' && r.cuisine !== activeCuisine) return false;
      if (courseFilter !== 'all' && !(r.courses || []).includes(courseFilter)) return false;
      if (sourcingFilter === 'in-house' && r.sourcingTier !== 'in-house') return false;
      if (sourcingFilter === 'branded' && r.sourcingTier === 'in-house') return false;
      if (tagFilters.length > 0 && !tagFilters.every(t => (r.tags || []).includes(t))) return false;
      if (dietFilters.length > 0 && dietFilters.some(d => (r.allergens || []).includes(d))) return false;
      if (q) {
        const hay = `${r.title} ${r.cuisineName} ${r.description || ''}`.toLowerCase();
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
  }, [recipes, activeCuisine, sortBy, search, courseFilter, sourcingFilter, tagFilters, dietFilters]);

  // ---------- Featured (Pick of the week) — first showstopper, deterministic ----------
  const featured = useMemo(() => {
    if (!recipes || recipes.length === 0) return null;
    const showstoppers = recipes.filter(r => (r.courses || []).includes('showstopper'));
    return showstoppers[0] || recipes[0];
  }, [recipes]);

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

  function addToMenu(recipe) {
    setMenu(prev => {
      const found = prev.find(it => it.id === recipe.id);
      if (found) {
        showToast('Already in your menu');
        return prev;
      }
      showToast(`${recipe.title} added`);
      return [...prev, { ...recipe, qty: 1 }];
    });
  }

  function changeQty(id, qty) {
    setMenu(prev => prev.map(it => it.id === id ? { ...it, qty } : it));
  }

  function removeFromMenu(id) {
    setMenu(prev => prev.filter(it => it.id !== id));
  }

  function openRecipe(recipe) {
    setModalRecipe(recipe);
    setModalOpen(true);
  }
  function closeRecipe() {
    setModalOpen(false);
    setTimeout(() => setModalRecipe(null), 220);
  }

  function toggleTag(tag) {
    setTagFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function toggleDiet(d) {
    setDietFilters(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  // ---------- Render gating ----------
  if (!index || recipes.length === 0) {
    return (
      <div className="empty-state">
        <h3>Recipe data missing</h3>
        <p>The recipe library failed to load. Run the parser:</p>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, opacity: 0.7, marginTop: 12 }}>
          bun recipes/base_document/scripts/parse-catalog.ts
        </p>
      </div>
    );
  }

  const stats = {
    recipes: index.totalRecipes,
    cuisines: index.cuisines.length,
    avgCost: index.avgCostPerPlate,
  };

  const activeName = activeCuisine === 'all'
    ? 'The whole library'
    : (window.CUISINE_META.find(c => c.id === activeCuisine)?.name + ' kitchen');

  const menuCount = menu.reduce((s, it) => s + it.qty, 0);

  return (
    <>
      <window.Hero featured={featured} stats={stats} />

      {(() => {
        const slot = typeof document !== 'undefined' ? document.getElementById('nav-menu-pill-slot') : null;
        const pill = (
          <button className="nav-menu-pill" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h10M4 18h16"/></svg>
            Your menu
            <span className="ct">{menuCount}</span>
          </button>
        );
        return slot ? ReactDOM.createPortal(pill, slot) : pill;
      })()}

      <>
          <div className="filter-row">
            <window.SearchBox value={search} onChange={setSearch} placeholder="Search 135+ recipes…" />
            <window.FilterChips
              activeCourse={courseFilter}
              onCourseChange={setCourseFilter}
              activeSourcing={sourcingFilter}
              onSourcingChange={setSourcingFilter}
              activeTags={tagFilters}
              onTagToggle={toggleTag}
              activeDiets={dietFilters}
              onDietToggle={toggleDiet}
            />
          </div>
          <window.CuisineBar active={activeCuisine} onChange={setActiveCuisine} counts={counts} />
          <window.Toolbar
            count={visible.length}
            activeName={activeName}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
          {visible.length === 0 ? (
            <div className="empty-state">
              <h3>No recipes match those filters.</h3>
              <p>Try clearing search, course, or sourcing — or pick a different cuisine.</p>
            </div>
          ) : (
            <main className="recipes">
              {visible.map(r => (
                <window.RecipeCard
                  key={r.id}
                  recipe={r}
                  saved={saved.has(r.id)}
                  inMenu={menu.some(it => it.id === r.id)}
                  onToggleSave={toggleSave}
                  onAddToMenu={addToMenu}
                  onOpen={openRecipe}
                />
              ))}
            </main>
          )}
        </>

      <footer className="foot">
        Animal Project Buddies · Recipes are free to use, share, and adapt for your kitchen ·
        Source recipes are linked to their authors. Found an issue?{' '}
        <a href="mailto:hello@animalprojectbuddies.com?subject=Recipes feedback" style={{ color: 'var(--moss)' }}>Email us</a>.
      </footer>

      <window.MenuDrawer
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
      <window.RecipeModal
        recipe={modalRecipe}
        open={modalOpen}
        onClose={closeRecipe}
        onAddToMenu={addToMenu}
        inMenu={modalRecipe ? menu.some(it => it.id === modalRecipe.id) : false}
      />
      <window.Toast message={toast.msg} show={toast.show} />
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
