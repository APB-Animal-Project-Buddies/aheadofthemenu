// UI components: Hero, SubTabs, MenuPill, SearchBox, FilterChips, CuisineBar, Toolbar,
// DishCard, DishModal, MenuDrawer, DairyTab, Toast.
// All exposed on window for app.jsx to compose.

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CUISINE_META, DiffDots, UrlStatusBadge,
  fmtCost, pluralize, parseMenuPrice
} from './helpers';

// Default dish image: shown when a dish has no image, or when its image URL
// fails to load (e.g. hotlink-protected sources). Lives in /public/assets.
const DEFAULT_DISH_IMAGE = '/assets/dish-placeholder.svg';

function DishPhoto({ src, alt, loading = 'lazy' }) {
  return (
    <img
      src={src || DEFAULT_DISH_IMAGE}
      alt={alt || ''}
      loading={loading}
      onError={(e) => {
        if (!e.currentTarget.src.endsWith(DEFAULT_DISH_IMAGE)) {
          e.currentTarget.src = DEFAULT_DISH_IMAGE;
        }
      }}
    />
  );
}

// ---------- SubTabs ----------
// Top sub-navigation between the Menus generator and the Dishs catalog.
// Tabs are real anchor links (separate Next.js routes) so back/forward
// works and each page can deep-link cleanly.
function SubTabs({ active, dishCount }) {
  return (
    <div className="sub-tabs">
      <a
        href="/menus"
        className={"sub-tab" + (active === 'menus' ? ' on' : '')}
      >Menus <span className="ct">generator</span></a>
      <a
        href="/dishes"
        className={"sub-tab" + (active === 'dishes' ? ' on' : '')}
      >Dishs <span className="ct">{dishCount ?? 135}</span></a>
    </div>
  );
}

// ---------- SearchBox ----------
function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="search-box">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3-3" />
      </svg>
      <input
        type="text"
        value={value}
        placeholder={placeholder || 'Search dishes…'}
        onChange={e => onChange(e.target.value)}
      />
      {value && <button className="clear" onClick={() => onChange('')}>Clear</button>}
    </div>
  );
}

// ---------- FilterChips ----------
function FilterChips({ activeCourse, onCourseChange, activeSourcing, onSourcingChange, activeTags, onTagToggle, activeDiets, onDietToggle }) {
  return (
    <>
      <div className="group">
        <span className="group-label">Course</span>
        <div className="fchip-group">
          {[
            { id: 'all', name: 'All' },
            { id: 'starter', name: 'Starter' },
            { id: 'main', name: 'Main' },
            { id: 'showstopper', name: 'Showstopper' },
            { id: 'dessert', name: 'Dessert' },
          ].map(c => (
            <button
              key={c.id}
              className={"fchip" + (activeCourse === c.id ? ' on' : '')}
              onClick={() => onCourseChange(c.id)}
            >{c.name}</button>
          ))}
        </div>
      </div>

      <div className="group">
        <span className="group-label">Sourcing</span>
        <div className="fchip-group">
          {[
            { id: 'all', name: 'All' },
            { id: 'in-house', name: '🌿 In-house only' },
            { id: 'branded', name: '🥩 Branded' },
          ].map(s => (
            <button
              key={s.id}
              className={"fchip" + (activeSourcing === s.id ? ' on' : '')}
              onClick={() => onSourcingChange(s.id)}
            >{s.name}</button>
          ))}
        </div>
      </div>

      <div className="group">
        <span className="group-label">Dietary</span>
        <div className="fchip-group">
          {[
            { id: 'gluten', label: 'Gluten-free' },
            { id: 'nuts', label: 'Nut-free' },
            { id: 'soy', label: 'Soy-free' },
            { id: 'coconut', label: 'Coconut-free' },
          ].map(d => (
            <button
              key={d.id}
              className={"fchip" + ((activeDiets || []).includes(d.id) ? ' on' : '')}
              onClick={() => onDietToggle(d.id)}
              title={`Hide dishes containing ${d.id}`}
            >{d.label}</button>
          ))}
        </div>
      </div>

    </>
  );
}

// ---------- CuisineBar ----------
function CuisineBar({ active, onChange, counts }) {
  return (
    <div className="cuisine-bar">
      {CUISINE_META.map(c => (
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
        <span className="ct">{count} {pluralize(count, 'dish')}</span>
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

// Renders inline **bold** markdown in a string to safe HTML.
function renderInlineMd(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// Classify cost-delta by sign only:
//   - / − → green (cheaper to cook)
//   +     → red   (more expensive)
//   baseline / n/a → neutral
function classifyDelta(delta) {
  const s = String(delta || '').trim().toLowerCase();
  if (!s || s === 'n/a' || s === '—' || s.includes('baseline')) return 'neutral';
  if (/^[-−]/.test(s)) return 'help';
  if (/^\+/.test(s)) return 'warn';
  return 'neutral';
}

// ---------- DishCard ----------
function DishCard({ dish, saved, inMenu, onToggleSave, onAddToMenu, onOpen }) {
  return (
    <article className="card" onClick={() => onOpen(dish)}>
      <div className="photo">
        <DishPhoto src={dish.image} alt={dish.title} loading="lazy" />
        {dish.badge && <div className="badge" data-tier={(dish.valueTier || '').toLowerCase().replace(/\s+/g, '-')}>{dish.badge}</div>}
        <button
          className={"save" + (saved ? ' saved' : '')}
          onClick={(e) => { e.stopPropagation(); onToggleSave(dish.id); }}
          aria-label="Save"
        >
          <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        {dish.sourcingTier && dish.sourcingTier !== 'in-house' && (
          <div className={"tier-mark " + dish.sourcingTier}>
            {dish.sourcingTier === 'branded' ? '🥩 Branded' : '🌿🥩 Hybrid'}
          </div>
        )}
      </div>
      <div className="body">
        <div className="cuisine">{dish.cuisineName}</div>
        <h3>{dish.title}</h3>
        {dish.source && <div className="source">— {dish.source}</div>}
        <p className="why" dangerouslySetInnerHTML={{ __html: renderInlineMd(dish.description) }} />
        <div className="meta">
          <div className="m"><div className="v">{dish.time || dish.prep || '—'}</div><div className="l">Prep</div></div>
          <div className="m"><div className="v">{dish.servings ?? '—'}</div><div className="l">Serves</div></div>
          <div className="m"><div className="v"><DiffDots n={dish.difficulty || 1} /></div><div className="l">Effort</div></div>
          <div className="m"><div className="v">{fmtCost(dish.cost)}</div><div className="l">/ plate</div></div>
        </div>
      </div>
      <button
        className={"add-btn" + (inMenu ? ' added' : '')}
        onClick={(e) => { e.stopPropagation(); onAddToMenu(dish); }}
        aria-label={inMenu ? 'In menu' : 'Add to menu'}
        title={inMenu ? 'In menu' : 'Add to menu'}
      >
        {inMenu ? '✓' : '+'}
      </button>
    </article>
  );
}

// ---------- DishModal ----------
function DishModal({ dish, open, onClose, onAddToMenu, inMenu }) {
  if (!dish) return null;
  const isTechnique = dish.urlStatus === 'reference-technique';
  return (
    <div className={"modal-backdrop" + (open ? " open" : "")} onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6" /></svg>
        </button>
        <div className="left">
          <div className="ph">
            <DishPhoto src={dish.image} alt={dish.title} loading="eager" />
          </div>
        </div>
        <div className="right">
          <div className="head">
            <div>
              <div className="cuisine-tag">
                {dish.cuisineName}
                {dish.courses && dish.courses.map(c => (
                  c !== 'main' ? <span key={c} style={{
                    marginLeft: 8, padding: '2px 8px',
                    background: 'oklch(0.62 0.14 45 / 0.16)', color: 'var(--terracotta)',
                    borderRadius: 999, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em'
                  }}>{c}</span> : null
                ))}
              </div>
              <h2>{dish.title}</h2>
              {dish.source && <div className="source modal-source">— {dish.source}</div>}
              <div style={{ marginTop: 8 }}>
                <UrlStatusBadge status={dish.urlStatus} />
              </div>
            </div>
          </div>

          <div className="why-block" dangerouslySetInnerHTML={{ __html: renderInlineMd(dish.description) }} />

          {dish.url && (
            <div className="url-block">
              <span className="url-text">{dish.url}</span>
              <a href={dish.url} target="_blank" rel="noopener noreferrer" className="primary" style={{
                padding: '6px 12px', borderRadius: 999,
                background: 'var(--moss)', color: 'var(--cream)',
                textDecoration: 'none', fontSize: 12, fontWeight: 600
              }}>Open ↗</a>
            </div>
          )}

          {dish.urlNote && <div className="url-note">"{dish.urlNote}"</div>}

          {dish.alternatives && dish.alternatives.length > 0 && (
            <div className="alternatives">
              <h4>Alternative dishes</h4>
              <ul>
                {dish.alternatives.map((alt, i) => (
                  <li key={i}>
                    <a href={alt.url} target="_blank" rel="noopener noreferrer">{alt.source} ↗</a>
                    <span className="alt-note">{alt.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isTechnique && (
            <div style={{
              padding: '10px 14px', borderRadius: 12,
              background: 'oklch(0.62 0.14 45 / 0.10)', color: 'var(--terracotta)',
              fontSize: 13, lineHeight: 1.45, marginBottom: 12,
            }}>
              <strong>Note:</strong> The linked dish is a non-vegan technique tutorial. Use the substitution table below as the operative dish.
            </div>
          )}

          <div className="meta-row">
            <div className="b"><div className="l">Prep</div><div className="v">{dish.time || dish.prep || '—'}</div></div>
            <div className="b"><div className="l">Serves</div><div className="v">{dish.servings ?? '—'}</div></div>
            <div className="b"><div className="l">Effort</div><div className="v"><DiffDots n={dish.difficulty || 1} /></div></div>
            <div className="b"><div className="l">/ plate</div><div className="v">{fmtCost(dish.cost)}</div></div>
          </div>

          {dish.menuPrice && (
            <div style={{ fontSize: 13, color: 'oklch(0.18 0.04 145 / 0.65)', marginBottom: 8 }}>
              <strong style={{ color: 'var(--moss-ink)' }}>Menu price:</strong> {dish.menuPrice}
              {dish.valueRatio != null && dish.valueTier && (
                <span className={"value-tier-tag tier-" + dish.valueTier.toLowerCase().replace(/\s+/g, '-')}>
                  {dish.valueRatio.toFixed(1)}× return · {dish.valueTier}
                </span>
              )}
            </div>
          )}

          {dish.tags && dish.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {dish.tags.includes('bulk-prep') && (
                <span style={{ padding: '4px 10px', borderRadius: 999, background: 'oklch(0.78 0.13 85 / 0.20)', color: 'oklch(0.45 0.10 85)', fontSize: 11, fontWeight: 600 }}>🥘 Bulk-prep</span>
              )}
              {dish.tags.includes('fast-service') && (
                <span style={{ padding: '4px 10px', borderRadius: 999, background: 'oklch(0.68 0.16 140 / 0.18)', color: 'oklch(0.30 0.10 140)', fontSize: 11, fontWeight: 600 }}>⚡ Fast-service</span>
              )}
            </div>
          )}

          {dish.subs && dish.subs.length > 0 && (
            <div>
              <h4>{isTechnique ? 'Operative dish — substitutions' : 'Allergen & dietary swaps'}</h4>
              <table className="subs-table">
                <thead>
                  <tr>
                    <th>Sub</th>
                    <th>Effect</th>
                    <th>Cost delta</th>
                  </tr>
                </thead>
                <tbody>
                  {dish.subs.map((s, i) => (
                    <tr key={i}>
                      <td dangerouslySetInnerHTML={{ __html: s.from.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
                      <td>{s.effect}</td>
                      <td className={"delta " + classifyDelta(s.delta)}>{s.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="modal-actions">
            <a href={dish._id ? `/dishes/${dish._id}` : (dish.url || '#')} style={{
              padding: '12px 20px', borderRadius: 999, border: '1px solid var(--line)',
              textDecoration: 'none', color: 'var(--moss-ink)', fontWeight: 600, fontSize: 13.5,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              View full dish
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
            </a>
            <a href={`/reviews/create?dishId=${dish._id}`}>
              <button className="primary">
                Create a review link for this dish
              </button>
            </a>
          </div>
        </div>
      </div>
    </div >
  );
}

// ---------- MenuDrawer ----------
function MenuDrawer({ open, items, onClose, onChangeQty, onRemove, menuName, setMenuName, servings, setServings }) {
  const itemCount = items.reduce((s, it) => s + it.qty, 0);
  const totalPerPlate = items.reduce((s, it) => s + (it.cost || 0) * it.qty, 0);
  const avgPerPlate = itemCount ? totalPerPlate / itemCount : 0;
  const totalForGuests = totalPerPlate * servings;

  function exportPdf() {
    document.body.classList.add('printing-menu');
    print();
    setTimeout(() => document.body.classList.remove('printing-menu'), 500);
  }

  function sendToKitchen() {
    const lines = [
      `Menu: ${menuName}`,
      `Food cost: $${totalPerPlate.toFixed(2)} / plate · $${totalForGuests.toFixed(2)} for ${servings} guests`,
      ``,
      `Dishes:`,
      ...items.map(it => `  • ${it.title} — ×${it.qty} @ ${fmtCost(it.cost)}/plate`),
      ``,
      `Generated from animalprojectbuddies.com/dishes`,
    ];
    const subject = encodeURIComponent(`Menu: ${menuName}`);
    const body = encodeURIComponent(lines.join('\n'));
    location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <div className={"drawer-backdrop" + (open ? " open" : "")} onClick={onClose} />
      <aside className={"drawer" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="dhead">
          <div>
            <h2>Build your menu</h2>
            <div className="sub">{itemCount} {pluralize(itemCount, 'dish', 'dishes')} · for {servings} guests</div>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6" /></svg>
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
              Tap the <span style={{ display: 'inline-grid', placeItems: 'center', width: 22, height: 22, borderRadius: 999, background: 'var(--moss)', color: 'var(--cream)', fontWeight: 600, verticalAlign: 'middle' }}>+</span> on any dish to add it here.
            </div>
          ) : items.map(it => (
            <div key={it.id} className="row">
              <div className="thumb">
                <DishPhoto src={it.image} alt={it.title} loading="lazy" />
              </div>
              <div className="info">
                <div className="t">{it.title}</div>
                <div className="m">{it.cuisineName} · {it.time || it.prep || '—'}</div>
                <div className="qty">
                  <button onClick={() => onChangeQty(it.id, Math.max(1, it.qty - 1))}>−</button>
                  <span className="v">×{it.qty}</span>
                  <button onClick={() => onChangeQty(it.id, it.qty + 1)}>+</button>
                </div>
              </div>
              <div className="price">${((it.cost || 0) * it.qty).toFixed(2)}<span className="price-unit"> / plate</span></div>
              <button className="x" onClick={() => onRemove(it.id)} aria-label="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6" /></svg>
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
              <div className="l">Food cost / plate</div>
              <div className="v">${totalPerPlate.toFixed(2)}</div>
            </div>
            <div className="t totals-footnote">
              <div className="l">For {servings} guests</div>
              <div className="v">${totalForGuests.toFixed(0)} total</div>
            </div>
          </div>
          <div className="actions">
            <button onClick={exportPdf} disabled={items.length === 0}>Export PDF</button>
            <button className="primary" onClick={sendToKitchen} disabled={items.length === 0}>Send to kitchen</button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ---------- Category tint mapping ----------
// Rotates through all 8 tints by index so no two adjacent cards share a tint.
// The order is intentionally interleaved (warm/cool/warm/cool…) so the page
// reads playful rather than monochrome. Mod-cycles for any number of cards.
const TINT_CYCLE = [
  'var(--tint-rose)',
  'var(--tint-sky)',
  'var(--tint-amber)',
  'var(--tint-leaf)',
  'var(--tint-cream)',
  'var(--tint-lavender)',
  'var(--tint-sand)',
  'var(--tint-butter)',
];
function tintForCategory(cat, index) {
  if (typeof index === 'number') return TINT_CYCLE[index % TINT_CYCLE.length];
  return TINT_CYCLE[0];
}

// ---------- CategoryCard — compact card for a single category ----------
// Layout (top → bottom):
//   1. Title row: displayName + use
//   2. Winner section (large, joyful): leader brand + parity/TASTY badge
//   3. Description (blurb)
//   4. Stat strip (consumer rating)
//   5. "See all alternatives" button → opens modal listing every pick
function CategoryCard({ cat, parityText, index }) {
  const [modalOpen, setModalOpen] = useState(false);
  const catHasParity = cat.tasteParity || (cat.picks || []).some(p => p.tasteParity);
  const tint = tintForCategory(cat, index);
  const displayName = cat.displayName || cat.name;
  const picks = cat.picks || [];
  const winner = picks[0];
  const winnerParity = winner && winner.tasteParity;
  const isApb = !!cat.apbCurated;
  // "Developing but still tasty" if same-or-better < 40 (or no data + no
  // tasty award). APB-curated cards CAN also be weak — they stack the
  // Kinder World Loves badge with the Developing one (e.g. Best Steaks).
  const isWeak = (cat.sameOrBetterPct != null && cat.sameOrBetterPct < 40)
    || (cat.sameOrBetterPct == null && !cat.tastyAward && !cat.tasteParity && !winnerParity);
  const winnerTasty = !isWeak && winner && (winner.tastyAward || cat.tastyAward);
  const altCount = Math.max(0, picks.length - 1);

  return (
    <article
      className={'alt-card' + (catHasParity ? ' parity' : '')}
      style={{ background: tint }}
    >
      {/* 1. Header */}
      <div className="alt-card-head">
        <div className="icon-frame">
          <DairyIcon name={cat.icon} />
        </div>
        <div className="cat-block">
          <div className="cat-name">{displayName}</div>
          <div className="cat-use">{cat.use}</div>
        </div>
      </div>

      {/* 2. WINNER — large + joyful */}
      {winner && (
        <div className="winner-block">
          <div className="winner-label">&#127942; 1st place</div>
          <div className="winner-brand">{winner.brand}</div>
          <div className="winner-badges">
            {isApb && <span className="badge apb">&#129505; Ahead of the Menu Loves</span>}
            {winnerParity && <span className="badge loved">&#129505; {parityText}</span>}
            {!isApb && winnerTasty && !winnerParity && <span className="badge tasty">&#9733; Top performer</span>}
            {isWeak && !winnerParity && <span className="badge developing">Developing but still tasty</span>}
          </div>
        </div>
      )}

      {/* 3. Description */}
      <p className="blurb">{cat.blurb}</p>

      {/* 4. Open modal — even for single-pick categories */}
      {picks.length > 0 && (
        <button
          type="button"
          className="see-all-btn"
          onClick={() => setModalOpen(true)}
        >
          {picks.length === 1
            ? <>See details &rarr;</>
            : <>See all alternatives ({picks.length}) &rarr;</>}
        </button>
      )}

      {/* Modal — portal to <body> so it escapes any card stacking context */}
      {modalOpen && ReactDOM.createPortal((
        <div
          className="alt-modal-backdrop"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="alt-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`All alternatives for ${displayName}`}
          >
            <button
              className="alt-modal-close"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >&times;</button>
            <div className="alt-modal-head">
              <div className="cat-name">{displayName}</div>
              <div className="cat-use">{cat.use} · benchmark: {cat.benchmark}</div>
            </div>
            <div className="alt-modal-list">
              {picks.map((pk, i) => {
                const pickParity = pk.tasteParity;
                const pickTasty = pk.tastyAward;
                return (
                  <div
                    key={pk.brand}
                    className={'alt-pick alt-pick-row' + (pickParity ? ' parity-pick' : '')}
                  >
                    <div className="alt-pick-rank">{i === 0 ? ' 1st' : ` ${i + 1}`}</div>
                    <div className="alt-pick-body">
                      <div className="alt-pick-head">
                        <span className="pick-brand">{pk.brand}</span>
                        {pickParity && <span className="pick-badge loved">&#129505; {parityText}</span>}
                        {pickTasty && !pickParity && <span className="pick-badge tasty">&#9733; Top performer</span>}
                      </div>
                      <div className="pick-note">{pk.note}</div>
                      {pk.url && (
                        <a
                          className="pick-buy"
                          href={pk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >Buy now &rarr;</a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ), document.body)}
    </article>
  );
}

// ---------- AlternativesTab — unified card component for dairy + meat ----------
function AlternativesTab({ data, sectionLabel, parityLabel }) {
  if (!data) {
    return <div className="loading-state"><div className="spinner" />Loading…</div>;
  }

  const hasParity = data.categories.some(c => c.tasteParity || (c.picks || []).some(p => p.tasteParity));
  const parityText = parityLabel || 'Reached taste parity';
  const recommends = data.chefRecommends || [];

  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
      {/* Section header */}
      <div className="alt-section-header">
        <h2>{sectionLabel}</h2>
        <p className="alt-section-sub">{data.headline}</p>
      </div>

      {/* Section-level callouts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        {hasParity && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '8px 14px', borderRadius: 999,
            background: 'oklch(0.62 0.14 45 / 0.12)',
            border: '1.5px solid var(--terracotta)',
            fontSize: 13,
            color: 'oklch(0.45 0.10 35)', fontWeight: 600,
          }}>
            <span>&#129505;</span>
            {parityText} — matched the animal benchmark in blind testing
          </div>
        )}
        {recommends.length > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '8px 14px', borderRadius: 999,
            background: 'oklch(0.78 0.13 85 / 0.18)',
            border: '1.5px solid oklch(0.78 0.13 85)',
            fontSize: 13,
            color: 'oklch(0.32 0.06 145)', fontWeight: 600,
          }}>
            <span>&#128081;</span>
            We recommend: {recommends.join(' · ')}
            <span style={{ fontWeight: 500, opacity: 0.75 }}>(for those willing to spend a bit more)</span>
          </div>
        )}
      </div>

      <div className="alt-grid">
        {data.categories.map((cat, i) => (
          <CategoryCard key={cat.id} cat={cat} parityText={parityText} index={i} />
        ))}
      </div>

      {/* Footer attribution */}
      <div className="alt-foot">
        Top products distilled from <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">{data.source}</a>.
        We will return to highlight more findings from the study soon.
      </div>
    </section>
  );
}

// ---------- DairyTab — kept for backwards compatibility; wraps AlternativesTab ----------
function DairyTab({ data }) {
  return <AlternativesTab data={data} sectionLabel="Plant-Based Dairy" />;
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

export {
  SubTabs, SearchBox, FilterChips, CuisineBar, Toolbar,
  DishCard, DishModal, MenuDrawer, DairyTab, AlternativesTab, Toast,
};
