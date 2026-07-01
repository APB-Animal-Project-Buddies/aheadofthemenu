// Shared menu chrome — renders the "Your menu" pill into the nav slot and the
// MenuDrawer into a body-level mount. Reads menu state from localStorage so the
// pill follows the user across /recipes, /top-dairy-products, and /tips-and-tricks.
//
// On /recipes the main app.jsx ALSO renders these (and writes to localStorage when
// items are added). To avoid duplication we only mount this chrome when the page
// did not opt in to its own menu rendering (i.e. there's no #recipes-page-root).

const STORAGE_KEY = 'apb-recipes-menu-v1';

function MenuChrome() {
  const { useState, useEffect } = React;

  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }
  const [stored, setStored] = useState(readStore);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menu = stored.menu || [];
  const menuName = stored.menuName || 'Spring tasting menu';
  const servings = stored.servings || 40;
  const menuCount = menu.reduce((s, it) => s + it.qty, 0);

  function write(patch) {
    const next = { ...stored, ...patch };
    setStored(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    // Custom event for same-tab sync across React mounts.
    window.dispatchEvent(new CustomEvent('apb-menu-updated'));
  }

  // Cross-tab sync via the storage event + same-tab sync via custom event.
  useEffect(() => {
    const onChange = () => setStored(readStore());
    const onStorage = (e) => { if (e.key === STORAGE_KEY) onChange(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('apb-menu-updated', onChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('apb-menu-updated', onChange);
    };
  }, []);

  const slot = document.getElementById('nav-menu-pill-slot');
  const pill = (
    <button
      className="nav-menu-pill"
      onClick={() => setDrawerOpen(true)}
      aria-label="Open menu"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 12h10M4 18h16"/>
      </svg>
      Your menu
      <span className="ct">{menuCount}</span>
    </button>
  );

  return (
    <>
      {slot && ReactDOM.createPortal(pill, slot)}
      <window.MenuDrawer
        open={drawerOpen}
        items={menu}
        onClose={() => setDrawerOpen(false)}
        onChangeQty={(id, qty) => write({ menu: menu.map(it => it.id === id ? { ...it, qty } : it) })}
        onRemove={(id) => write({ menu: menu.filter(it => it.id !== id) })}
        menuName={menuName}
        setMenuName={(name) => write({ menuName: name })}
        servings={servings}
        setServings={(s) => write({ servings: s })}
      />
    </>
  );
}

const mount = document.getElementById('menu-chrome-root');
if (mount) {
  ReactDOM.createRoot(mount).render(<MenuChrome />);
}
