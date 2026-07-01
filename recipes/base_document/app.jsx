// Main app — composes everything, manages state.
const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "terracotta",
  "density": "comfortable",
  "showWhy": true,
  "heroStyle": "editorial",
  "cardStyle": "soft"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  const [activeCuisine, setActiveCuisine] = useState('all');
  const [sortBy, setSortBy] = useState('curated');
  const [saved, setSaved] = useState(new Set());
  const [menu, setMenu] = useState([]); // [{...recipe, qty}]
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalRecipe, setModalRecipe] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuName, setMenuName] = useState("Spring tasting menu");
  const [servings, setServings] = useState(40);
  const [toast, setToast] = useState({ msg: '', show: false });

  // Derive counts per cuisine
  const counts = useMemo(() => {
    const c = { all: window.RECIPES.length };
    for (const r of window.RECIPES) c[r.cuisine] = (c[r.cuisine] || 0) + 1;
    return c;
  }, []);

  // Filter + sort
  const visible = useMemo(() => {
    let list = window.RECIPES.filter(r => activeCuisine === 'all' || r.cuisine === activeCuisine);
    if (sortBy === 'time') {
      list = [...list].sort((a, b) => parseInt(a.prep) - parseInt(b.prep));
    } else if (sortBy === 'cost') {
      list = [...list].sort((a, b) => a.cost - b.cost);
    } else if (sortBy === 'easy') {
      list = [...list].sort((a, b) => a.difficulty - b.difficulty);
    }
    return list;
  }, [activeCuisine, sortBy]);

  // Apply accent tweak by injecting css custom prop on body
  useEffect(() => {
    const accents = {
      terracotta: 'oklch(0.62 0.14 45)',
      mustard: 'oklch(0.78 0.13 85)',
      plum: 'oklch(0.50 0.13 15)',
      leaf: 'oklch(0.62 0.16 140)',
    };
    document.documentElement.style.setProperty('--terracotta', accents[tweaks.accent] || accents.terracotta);
  }, [tweaks.accent]);

  // Density tweak — alter grid gap/min-card via class on root
  const rootClass = `density-${tweaks.density} hero-${tweaks.heroStyle} card-${tweaks.cardStyle} ${tweaks.showWhy ? '' : 'no-why'}`;

  useEffect(() => {
    document.body.className = rootClass;
  }, [rootClass]);

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

  // Pick of the week — featured recipe (deterministic by date)
  const featured = window.RECIPES[5]; // Black Lentil Dal Makhani

  const activeName = activeCuisine === 'all'
    ? 'The whole library'
    : window.CUISINES.find(c => c.id === activeCuisine)?.name + ' kitchen';

  return (
    <>
      <window.SiteNav menuCount={menu.reduce((s, it) => s + it.qty, 0)} onOpenMenu={() => setDrawerOpen(true)} />
      <window.Hero featured={featured} />
      <window.CuisineBar active={activeCuisine} onChange={setActiveCuisine} counts={counts} />
      <window.Toolbar count={visible.length} activeName={activeName} sortBy={sortBy} onSortChange={setSortBy} />
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
      <footer className="foot">
        Animal Project Buddies · Recipes are free to use, share, and adapt for your kitchen
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

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection title="Accent color">
          <window.TweakRadio
            value={tweaks.accent}
            onChange={v => setTweak('accent', v)}
            options={[
              { value: 'terracotta', label: 'Terracotta' },
              { value: 'mustard', label: 'Mustard' },
              { value: 'plum', label: 'Plum' },
              { value: 'leaf', label: 'Leaf' },
            ]}
          />
        </window.TweakSection>
        <window.TweakSection title="Card density">
          <window.TweakRadio
            value={tweaks.density}
            onChange={v => setTweak('density', v)}
            options={[
              { value: 'airy', label: 'Airy' },
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
          />
        </window.TweakSection>
        <window.TweakSection title="Card style">
          <window.TweakRadio
            value={tweaks.cardStyle}
            onChange={v => setTweak('cardStyle', v)}
            options={[
              { value: 'soft', label: 'Soft' },
              { value: 'editorial', label: 'Editorial' },
              { value: 'bold', label: 'Bold' },
            ]}
          />
        </window.TweakSection>
        <window.TweakSection title="Hero">
          <window.TweakRadio
            value={tweaks.heroStyle}
            onChange={v => setTweak('heroStyle', v)}
            options={[
              { value: 'editorial', label: 'With pick of week' },
              { value: 'minimal', label: 'Minimal' },
            ]}
          />
        </window.TweakSection>
        <window.TweakSection title="Card detail">
          <window.TweakToggle
            value={tweaks.showWhy}
            onChange={v => setTweak('showWhy', v)}
            label="Show 'why it works'"
          />
        </window.TweakSection>
      </window.TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
