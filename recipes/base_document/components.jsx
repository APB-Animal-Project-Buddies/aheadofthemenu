// UI components: Hero, CuisineBar, RecipeCard, MenuDrawer, RecipeModal, Toast.
// All exposed on window for the app script.

const { useState, useEffect, useMemo, useRef } = React;

// ---------- SiteNav ----------
function SiteNav({ menuCount, onOpenMenu }) {
  return (
    <header className="site-nav">
      <div className="brand">
        <div className="mark">A</div>
        <span>Animal Project Buddies</span>
      </div>
      <nav>
        <a href="#">Mission</a>
        <a href="#">Sanctuaries</a>
        <a href="menus.html">Menus</a>
        <a href="recipes.html" className="active">Recipes</a>
        <a href="#">Stories</a>
      </nav>
      <div className="right">
        <button className="menu-btn" onClick={onOpenMenu}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h10M4 18h16"/></svg>
          Your menu
          <span className="count">{menuCount}</span>
        </button>
      </div>
    </header>
  );
}

// ---------- Hero ----------
function Hero({ featured }) {
  return (
    <section className="hero">
      <div>
        <div className="eyebrow"><span className="dot"/>Recipes · Curated for restaurant kitchens</div>
        <h1>
          Make your food <em>tasty</em>,<br />
          <span className="leaf"></span>refresh, and <em>kind</em>.
        </h1>
        <p className="lede">
          A working library of plant-based dishes built for the line — vetted by chefs, costed for restaurants, scaled to service. Restaurant-grade, weeknight-easy.
        </p>
        <div className="stats">
          <div className="stat"><div className="num">{window.RECIPES.length}</div><div className="lbl">Tested recipes</div></div>
          <div className="stat"><div className="num">15</div><div className="lbl">Cuisines</div></div>
          <div className="stat"><div className="num">$2.85</div><div className="lbl">Avg cost / plate</div></div>
        </div>
      </div>
      <div className="hero-card">
        <div className="ph">
          <window.PhotoPH palette={window.paletteFor(featured.cuisine)} dish={featured.photo} label={featured.photoLabel} />
          <div className="tag">Pick of the week</div>
        </div>
        <h3>{featured.title}</h3>
        <div className="meta">
          <span>{featured.cuisineName}</span>
          <span>·</span>
          <span>{featured.prep}</span>
          <span>·</span>
          <span>${featured.cost.toFixed(2)} / plate</span>
        </div>
      </div>
    </section>
  );
}

// ---------- CuisineBar ----------
function CuisineBar({ active, onChange, counts }) {
  return (
    <div className="cuisine-bar">
      {window.CUISINES.map(c => (
        <button
          key={c.id}
          className={"chip" + (active === c.id ? " active" : "")}
          onClick={() => onChange(c.id)}
        >
          {c.name}
          <span className="ct">{counts[c.id] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- Toolbar ----------
function Toolbar({ count, activeName, sortBy, onSortChange }) {
  const sorts = [
    { id: 'curated', name: 'Curated' },
    { id: 'time', name: 'Quickest' },
    { id: 'cost', name: 'Lowest cost' },
    { id: 'easy', name: 'Easiest' },
  ];
  return (
    <div className="toolbar">
      <div className="lhs">
        <h2>{activeName}</h2>
        <span className="ct">{count} recipes</span>
      </div>
      <div className="filters">
        {sorts.map(s => (
          <button
            key={s.id}
            className={"fchip" + (sortBy === s.id ? " on" : "")}
            onClick={() => onSortChange(s.id)}
          >{s.name}</button>
        ))}
      </div>
    </div>
  );
}

// ---------- DiffDots ----------
function DiffDots({ n }) {
  return (
    <span className="diff-dots">
      {[1,2,3].map(i => <span key={i} className={i <= n ? 'on' : ''} />)}
    </span>
  );
}

// ---------- RecipeCard ----------
function RecipeCard({ recipe, saved, inMenu, onToggleSave, onAddToMenu, onOpen }) {
  const palette = window.paletteFor(recipe.cuisine);
  return (
    <article className="card" onClick={() => onOpen(recipe)}>
      <div className="photo">
        <window.PhotoPH palette={palette} dish={recipe.photo} label={recipe.photoLabel} />
        {recipe.badge && <div className="badge">{recipe.badge}</div>}
        <button
          className={"save" + (saved ? ' saved' : '')}
          onClick={(e) => { e.stopPropagation(); onToggleSave(recipe.id); }}
          aria-label="Save"
        >
          <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <div className="reveal">
          <div className="lbl">Key ingredients</div>
          <div className="ings">
            {recipe.ingredients.slice(0, 5).map(i => <span key={i}>{i}</span>)}
          </div>
        </div>
      </div>
      <div className="body">
        <div className="cuisine">{recipe.cuisineName}</div>
        <h3>{recipe.title}</h3>
        {recipe.source && <div className="source">{recipe.source}</div>}
        <p className="why">{recipe.why}</p>
        <div className="meta">
          <div className="m"><div className="v">{recipe.prep}</div><div className="l">Prep</div></div>
          <div className="m"><div className="v">{recipe.serves}</div><div className="l">Serves</div></div>
          <div className="m"><div className="v"><DiffDots n={recipe.difficulty} /></div><div className="l">Effort</div></div>
          <div className="m"><div className="v">${recipe.cost.toFixed(2)}</div><div className="l">/ plate</div></div>
        </div>
      </div>
      <button
        className={"add-btn" + (inMenu ? ' added' : '')}
        onClick={(e) => { e.stopPropagation(); onAddToMenu(recipe); }}
        aria-label={inMenu ? 'In menu' : 'Add to menu'}
        title={inMenu ? 'In menu' : 'Add to menu'}
      >
        {inMenu ? '✓' : '+'}
      </button>
    </article>
  );
}

// ---------- MenuDrawer ----------
function MenuDrawer({ open, items, onClose, onChangeQty, onRemove, menuName, setMenuName, servings, setServings }) {
  const subtotalPerServing = items.reduce((s, it) => s + it.cost * it.qty, 0);
  const totalForServings = subtotalPerServing * (servings / 4); // baseline serves=4 reference
  // simpler: each line is "qty plates"; cost per plate; total = sum(qty * cost) * servings/4? No — let's interpret:
  // Items have a per-plate cost. The "servings" picker scales the whole menu.
  // qty = number of dishes of this recipe in the menu (e.g. 1 main + 1 starter).
  // total = (sum over items of qty*cost) * servings — that's cost for `servings` plates of each item.
  const total = items.reduce((s, it) => s + it.cost * it.qty * servings, 0);
  const itemCount = items.reduce((s, it) => s + it.qty, 0);
  const avgPerPlate = itemCount ? items.reduce((s, it) => s + it.cost * it.qty, 0) / itemCount : 0;
  return (
    <>
      <div className={"drawer-backdrop" + (open ? " open" : "")} onClick={onClose} />
      <aside className={"drawer" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="dhead">
          <div>
            <h2>Build your menu</h2>
            <div className="sub">{itemCount} dish{itemCount === 1 ? '' : 'es'} · for {servings} guests</div>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
          </button>
        </div>
        <input
          className="name-input"
          value={menuName}
          onChange={e => setMenuName(e.target.value)}
          placeholder="Menu name"
        />
        <div className="body">
          {items.length === 0 ? (
            <div className="empty">
              <strong>Start your menu.</strong>
              Tap the <span style={{display:'inline-grid', placeItems:'center', width:22, height:22, borderRadius:999, background:'var(--moss)', color:'var(--cream)', fontWeight:600, verticalAlign:'middle'}}>+</span> on any recipe to add it here.
            </div>
          ) : items.map(it => (
            <div key={it.id} className="row">
              <div className="thumb">
                <window.PhotoPH palette={window.paletteFor(it.cuisine)} dish={it.photo} label="" />
              </div>
              <div className="info">
                <div className="t">{it.title}</div>
                <div className="m">{it.cuisineName} · {it.prep}</div>
                <div className="qty">
                  <button onClick={() => onChangeQty(it.id, Math.max(1, it.qty - 1))}>−</button>
                  <span className="v">×{it.qty}</span>
                  <button onClick={() => onChangeQty(it.id, it.qty + 1)}>+</button>
                </div>
              </div>
              <div className="price">${(it.cost * it.qty * servings).toFixed(2)}</div>
              <button className="x" onClick={() => onRemove(it.id)} aria-label="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
              </button>
            </div>
          ))}
        </div>
        <div className="summary">
          <div className="servings">
            <div>
              <div className="lbl">Service size</div>
            </div>
            <div className="picker">
              <button onClick={() => setServings(Math.max(2, servings - 2))}>−</button>
              <span className="v">{servings} guests</span>
              <button onClick={() => setServings(servings + 2)}>+</button>
            </div>
          </div>
          <div className="totals">
            <div className="t">
              <div className="l">Avg / plate</div>
              <div className="v">${avgPerPlate.toFixed(2)}</div>
            </div>
            <div className="t grand">
              <div className="l">Total food cost</div>
              <div className="v">${total.toFixed(2)}</div>
            </div>
          </div>
          <div className="actions">
            <button>Export PDF</button>
            <button className="primary">Send to kitchen</button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ---------- RecipeModal ----------
function RecipeModal({ recipe, open, onClose, onAddToMenu, inMenu }) {
  if (!recipe) return null;
  const palette = window.paletteFor(recipe.cuisine);
  return (
    <div className={"modal-backdrop" + (open ? " open" : "")} onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
        <div className="left">
          <div className="ph">
            <window.PhotoPH palette={palette} dish={recipe.photo} label={recipe.photoLabel} />
          </div>
        </div>
        <div className="right">
          <div className="head">
            <div>
              <div className="cuisine-tag">{recipe.cuisineName}</div>
              <h2>{recipe.title}</h2>
              {recipe.source && <div className="source modal-source">{recipe.source}</div>}
            </div>
          </div>
          <div className="why-block">{recipe.why}</div>
          <div className="meta-row">
            <div className="b"><div className="l">Prep</div><div className="v">{recipe.prep}</div></div>
            <div className="b"><div className="l">Serves</div><div className="v">{recipe.serves}</div></div>
            <div className="b"><div className="l">Effort</div><div className="v"><DiffDots n={recipe.difficulty} /></div></div>
            <div className="b"><div className="l">/ plate</div><div className="v">${recipe.cost.toFixed(2)}</div></div>
          </div>
          <div>
            <h4>Equipment</h4>
            <div className="equip">
              {recipe.equipment.map(e => <span key={e}>{e}</span>)}
            </div>
          </div>
          <div>
            <h4>Allergen & dietary swaps</h4>
            <div className="subs">
              {recipe.subs.map(([from, to], i) => (
                <div key={i} className="sub-row">
                  <span>{from}</span>
                  <span className="arrow">→</span>
                  <span>{to}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button>View full recipe</button>
            <button className="primary" onClick={() => onAddToMenu(recipe)}>
              {inMenu ? '✓ In your menu' : '+ Add to menu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Toast ----------
function Toast({ message, show }) {
  return (
    <div className={"toast" + (show ? " show" : "")}>
      <span className="dot" />
      {message}
    </div>
  );
}

Object.assign(window, {
  SiteNav, Hero, CuisineBar, Toolbar, RecipeCard, MenuDrawer, RecipeModal, Toast, DiffDots,
});
