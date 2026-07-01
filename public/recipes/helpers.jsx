// Cuisine palettes, photo placeholder, URL-status badge, and small UI helpers.
// All exposed on `window` for the other Babel-loaded scripts.

const PALETTES = {
  italian:        ['oklch(0.72 0.12 35)', 'oklch(0.55 0.16 28)', 'oklch(0.85 0.08 90)'],
  french:         ['oklch(0.78 0.06 80)', 'oklch(0.65 0.10 70)', 'oklch(0.42 0.08 50)'],
  german:         ['oklch(0.50 0.10 50)', 'oklch(0.65 0.10 70)', 'oklch(0.42 0.08 40)'],
  indian:         ['oklch(0.62 0.16 60)', 'oklch(0.55 0.18 35)', 'oklch(0.75 0.14 85)'],
  mexican:        ['oklch(0.58 0.16 30)', 'oklch(0.70 0.16 70)', 'oklch(0.55 0.15 140)'],
  japanese:       ['oklch(0.78 0.04 130)', 'oklch(0.45 0.10 30)', 'oklch(0.92 0.02 100)'],
  thai:           ['oklch(0.70 0.15 75)', 'oklch(0.55 0.16 140)', 'oklch(0.62 0.18 30)'],
  chinese:        ['oklch(0.55 0.16 30)', 'oklch(0.42 0.10 50)', 'oklch(0.78 0.12 75)'],
  'middle-eastern': ['oklch(0.62 0.10 60)', 'oklch(0.50 0.12 40)', 'oklch(0.75 0.10 90)'],
  mediterranean:  ['oklch(0.68 0.14 140)', 'oklch(0.78 0.10 90)', 'oklch(0.55 0.14 35)'],
  american:       ['oklch(0.55 0.14 35)', 'oklch(0.72 0.13 75)', 'oklch(0.42 0.08 50)'],
  korean:         ['oklch(0.55 0.18 30)', 'oklch(0.62 0.16 140)', 'oklch(0.85 0.06 90)'],
  vietnamese:     ['oklch(0.72 0.14 130)', 'oklch(0.78 0.10 80)', 'oklch(0.55 0.14 35)'],
  caribbean:      ['oklch(0.68 0.16 70)', 'oklch(0.55 0.16 140)', 'oklch(0.58 0.16 30)'],
  ethiopian:      ['oklch(0.55 0.14 50)', 'oklch(0.45 0.10 30)', 'oklch(0.78 0.10 90)'],
  spanish:        ['oklch(0.62 0.16 50)', 'oklch(0.78 0.13 75)', 'oklch(0.45 0.12 30)'],
  'fast-food':    ['oklch(0.65 0.18 30)', 'oklch(0.78 0.13 85)', 'oklch(0.55 0.10 50)'],
  brazilian:      ['oklch(0.62 0.16 130)', 'oklch(0.78 0.13 75)', 'oklch(0.45 0.12 35)'],
};

function paletteFor(cuisine) { return PALETTES[cuisine] || PALETTES.italian; }

// Cuisine display metadata — slug + tag (cruelty-free phrase).
// Counts are populated at runtime from _index.json.
const CUISINE_META = [
  { id: 'all',            name: 'All',            tag: 'Cruelty-free, restaurant-grade' },
  { id: 'american',       name: 'American',       tag: 'No Cruelty' },
  { id: 'indian',         name: 'Indian',         tag: 'बिना हिंसा · Bina hinsa' },
  { id: 'french',         name: 'French',         tag: 'Sans cruauté' },
  { id: 'italian',        name: 'Italian',        tag: 'Senza crudeltà' },
  { id: 'ethiopian',      name: 'Ethiopian',      tag: 'ያለ ጭካኔ · Yale chikane' },
  { id: 'fast-food',      name: 'Fast-Food',      tag: 'Cruelty-free copycats' },
  { id: 'mexican',        name: 'Mexican',        tag: 'Sin crueldad' },
  { id: 'japanese',       name: 'Japanese',       tag: '虐待のない · Gyakutai no nai' },
  { id: 'thai',           name: 'Thai',           tag: 'ไร้ความโหดร้าย' },
  { id: 'chinese',        name: 'Chinese',        tag: '零残忍 · Líng cánrěn' },
  { id: 'middle-eastern', name: 'Middle Eastern', tag: 'بدون قسوة · Bidoun qaswa' },
  { id: 'mediterranean',  name: 'Mediterranean',  tag: 'Sense crueltat' },
  { id: 'korean',         name: 'Korean',         tag: '학대 없는 · Hakdae eomneun' },
  { id: 'vietnamese',     name: 'Vietnamese',     tag: 'Không tàn nhẫn' },
  { id: 'caribbean',      name: 'Caribbean',      tag: 'Cruelty-free' },
  { id: 'spanish',        name: 'Spanish',        tag: 'Sin crueldad' },
  { id: 'brazilian',      name: 'Brazilian',      tag: 'Sem crueldade' },
];

// Photo placeholder — abstract gradient blob keyed by dish-shape + cuisine palette.
function PhotoPH({ palette, label, dish }) {
  const bg = palette[0];
  const a = palette[1];
  const b = palette[2];
  let layers;
  if (dish === 'bowl') {
    layers = `
      radial-gradient(ellipse 55% 38% at 50% 60%, ${a} 0%, ${a} 35%, transparent 60%),
      radial-gradient(ellipse 30% 18% at 50% 56%, ${b} 0%, transparent 70%),
      radial-gradient(circle at 30% 35%, oklch(0.96 0.02 85 / 0.18) 0%, transparent 30%)
    `;
  } else if (dish === 'plate') {
    layers = `
      radial-gradient(circle at 50% 55%, ${a} 0%, ${a} 32%, transparent 34%),
      radial-gradient(circle at 50% 55%, ${b} 0%, ${b} 18%, transparent 20%),
      radial-gradient(circle at 35% 45%, oklch(0.96 0.02 85 / 0.2) 0%, transparent 18%)
    `;
  } else if (dish === 'flat') {
    layers = `
      linear-gradient(135deg, ${a} 0%, ${a} 50%, ${b} 50%, ${b} 100%),
      radial-gradient(circle at 30% 30%, oklch(0.96 0.02 85 / 0.2) 0%, transparent 25%)
    `;
  } else {
    layers = `
      linear-gradient(180deg, transparent 0%, transparent 55%, ${a} 55%, ${a} 75%, ${b} 75%, ${b} 100%),
      radial-gradient(ellipse 40% 20% at 50% 55%, ${a} 0%, transparent 70%)
    `;
  }
  return (
    <div className="photo-ph" style={{ background: `${layers}, ${bg}` }}>
      <div className="label">{label || 'food photo'}</div>
    </div>
  );
}

// Difficulty dots
function DiffDots({ n }) {
  return (
    <span className="diff-dots">
      {[1,2,3].map(i => <span key={i} className={i <= n ? 'on' : ''} />)}
    </span>
  );
}

// URL status badge
function UrlStatusBadge({ status }) {
  if (!status || status === 'unknown') return null;
  const labels = {
    'verified': 'Verified',
    'reference-vegan': 'Vegan technique',
    'reference-technique': 'Vegan rebuild',
    'in-house': 'APB recipe',
  };
  return (
    <span className={`url-status ${status}`}>
      <span className="status-dot" />
      {labels[status] || status}
    </span>
  );
}

// Format helpers
function fmtCost(n) { return n != null ? `$${n.toFixed(2)}` : '—'; }
function pluralize(n, single, plural) { return n === 1 ? single : (plural || single + 's'); }

// Best-effort parse of the catalog's menuPrice string (e.g. "$11–14 (entrée) / $7–9 (side)").
// Returns { low, high, mid } or null if no $ range is found. We use the first range we see.
function parseMenuPrice(s) {
  if (!s) return null;
  const range = String(s).match(/\$\s*([\d]+(?:\.\d+)?)\s*[–\-—]\s*\$?\s*([\d]+(?:\.\d+)?)/);
  if (range) {
    const low = parseFloat(range[1]);
    const high = parseFloat(range[2]);
    return { low, high, mid: (low + high) / 2 };
  }
  const single = String(s).match(/\$\s*([\d]+(?:\.\d+)?)/);
  if (single) {
    const v = parseFloat(single[1]);
    return { low: v, high: v, mid: v };
  }
  return null;
}

Object.assign(window, {
  PALETTES, paletteFor, CUISINE_META, PhotoPH, DiffDots, UrlStatusBadge,
  fmtCost, pluralize, parseMenuPrice,
});
