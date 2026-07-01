// Menus page — fusion-capable random menu generator + elegant editorial layout

const { useState, useEffect, useMemo, useRef } = React;

const COURSE_PLANS = {
  3: [
    { key: 'starter',  label: 'Apertivo · Starter',     pickFrom: ['easy','quick'] },
    { key: 'main',     label: 'Plato fuerte · Main',    pickFrom: ['hero'] },
    { key: 'dessert',  label: 'Dolce · Sweet finish',   pickFrom: ['any'] },
  ],
  4: [
    { key: 'starter',  label: 'Apertivo · Starter',     pickFrom: ['easy','quick'] },
    { key: 'second',   label: 'Secondo · Small plate',  pickFrom: ['easy'] },
    { key: 'main',     label: 'Plato fuerte · Main',    pickFrom: ['hero'] },
    { key: 'dessert',  label: 'Dolce · Sweet finish',   pickFrom: ['any'] },
  ],
  5: [
    { key: 'amuse',    label: 'Amuse · One bite',       pickFrom: ['quick'] },
    { key: 'starter',  label: 'Apertivo · Starter',     pickFrom: ['easy'] },
    { key: 'second',   label: 'Secondo · Small plate',  pickFrom: ['easy'] },
    { key: 'main',     label: 'Plato fuerte · Main',    pickFrom: ['hero'] },
    { key: 'dessert',  label: 'Dolce · Sweet finish',   pickFrom: ['any'] },
  ],
  7: [
    { key: 'amuse',    label: 'Amuse · One bite',       pickFrom: ['quick'] },
    { key: 'starter',  label: 'Apertivo · Starter',     pickFrom: ['easy'] },
    { key: 'second',   label: 'Secondo · Small plate',  pickFrom: ['easy'] },
    { key: 'pasta',    label: 'Primi · Grain or pasta', pickFrom: ['any'] },
    { key: 'main',     label: 'Plato fuerte · Main',    pickFrom: ['hero'] },
    { key: 'cheese',   label: 'Intermezzo · Palate',    pickFrom: ['easy'] },
    { key: 'dessert',  label: 'Dolce · Sweet finish',   pickFrom: ['any'] },
  ],
};

const MOODS = [
  { id: 'weeknight', label: 'Quick weeknight', ic: '⚡', courses: 3, servings: 8 },
  { id: 'tasting',   label: 'Tasting menu',    ic: '✦', courses: 7, servings: 16 },
  { id: 'brunch',    label: 'Brunch service',  ic: '☕', courses: 4, servings: 24 },
  { id: 'date',      label: 'Date night',      ic: '♥', courses: 5, servings: 2 },
  { id: 'service',   label: 'Full service',    ic: '✱', courses: 4, servings: 60 },
];

// Diet filters are driven by the explicit `r.allergens` array set in
// data.jsx (derived + per-recipe overrides). Each diet hides recipes
// that contain its allergen.
const DIETS = [
  { id: 'gluten-free',  label: 'Gluten-free',  allergen: 'gluten'  },
  { id: 'nut-free',     label: 'Nut-free',     allergen: 'nuts'    },
  { id: 'soy-free',     label: 'Soy-free',     allergen: 'soy'     },
  { id: 'coconut-free', label: 'Coconut-free', allergen: 'coconut' },
];
DIETS.forEach(d => { d.match = r => !(r.allergens || []).includes(d.allergen); });

const NAME_PARTS = {
  italian:        { a: ['Trattoria','Bottega','Osteria','Cucina','Vigna','Locanda'],   b: ['di Toscana','Verde','del Mare','d\'Autunno','Domestica','della Nonna'] },
  french:         { a: ['Bistro','Brasserie','Maison','Auberge','Petit','Café'],       b: ['Verte','des Champs','du Marché','Sauvage','Lumière','de l\'Olivier'] },
  german:         { a: ['Tisch','Gasthaus','Werkstatt','Speisekarte','Garten','Stube'], b: ['Grün','am Markt','der Saison','Frühling','Herbst','vom Land'] },
  indian:         { a: ['Thali','Dastarkhwan','Rasoi','Dawat','Bhojan','Mehfil'],      b: ['of Awadh','Verdant','Spice Road','Monsoon','of Kashmir','Earthen'] },
  mexican:        { a: ['Mesa','Mercado','Cocina','Cantina','Fonda','Comal'],         b: ['Verde','de la Tierra','del Maíz','Madre','de Oaxaca','del Sol'] },
  japanese:       { a: ['Kappō','Izakaya','Omakase','Yashoku','Teishoku','Hashi'],    b: ['Midori','Hana','no Mori','Sakura','Tsuki','Kiyomi'] },
  thai:           { a: ['Kruang','Aharn','Talad','Tok','Sapao','Ban'],                b: ['Garden','Verde','Lemongrass','Monsoon','Kanyai','Saen'] },
  chinese:        { a: ['Yuán','Cháguǎn','Lóng','Xīng','Sì Hǎi','Jiā'],               b: ['Lǜsè','of the Lotus','Bamboo','Eight Treasures','Dragonwell','of Spring'] },
  'middle-eastern': { a: ['Sufra','Maïda','Beit','Mazah','Souk','Tabla'],             b: ['of Levant','of Cedar','of Olives','Verde','Spice Souk','of Damascus'] },
  mediterranean:  { a: ['Taverna','Mesa','Casa','Olivar','Cala','Patio'],             b: ['Verde','del Mar','del Sol','d\'Estiu','de l\'Hort','Andalus'] },
  american:       { a: ['Field','Hearth','Table','Larder','Grange','Pasture'],        b: ['& Vine','Verdant','Heritage','Greens','Plot 14','South Forty'] },
  korean:         { a: ['Sangcha','Bapsang','Jip','Maru','Jeong','Pyeon'],            b: ['Green','of Seoul','of the Mountain','Saewa','Cheongnok','Pure'] },
  vietnamese:     { a: ['Mâm','Quán','Bàn','Vườn','Phở','Sài'],                       b: ['Xanh','of the Delta','Saigon','Hà Nội','Lemongrass','Verdant'] },
  caribbean:      { a: ['Yard','Cabana','Pasture','Galley','Cay','Soufrière'],        b: ['Verde','of Spice','Trade Winds','Pimento','Island Plate','Roots'] },
  ethiopian:      { a: ['Mesob','Gibi','Sagara','Buna','Selam','Ras'],                b: ['Verde','of Lalibela','Coffee Forest','Gondar','Highlands','of the Rift'] },
  spanish:        { a: ['Mesa','Bodega','Casa','Patio','Cortijo','Plaza'],            b: ['Verde','del Olivar','de la Vega','Andalusí','Manchego','del Sol'] },
};

const FUSION_NAMES = ['Crossroads','Hemispheres','Atlas','Concord','Common Table','Equinox','Migration','Pollen','Lattice','Dialect'];
const FUSION_TAILS = ['Verde','Verdant','of the Soil','of Travelers','at Sundown','Project','Plate','Composition'];

// Pairings — simple, themed, plant-friendly
const PAIRING_BY_CUISINE = {
  italian:        ['Vermentino','Lambrusco','Aperol spritz','Sangiovese','Bitter cherry kombucha'],
  french:         ['Côtes du Rhône','Beaujolais','Pastis & soda','Champagne','Verjus & elderflower'],
  german:         ['Riesling','Weissbier','Schnapps','Apfelschorle','Gentian tonic'],
  indian:         ['Lassi','Riesling','Jasmine tea','Tamarind kombucha','Spiced chai'],
  mexican:        ['Mezcal flight','Aguachile water','Hibiscus agua','Tepache','Mexican lager'],
  japanese:       ['Junmai sake','Hojicha','Yuzu spritz','Plum highball','Mugicha'],
  thai:           ['Singha','Lemongrass cooler','Riesling','Thai iced tea','Coconut water'],
  chinese:        ['Tieguanyin','Plum wine','Báijiǔ flight','Sparkling jasmine','Chrysanthemum'],
  'middle-eastern': ['Mint tea','Pomegranate spritz','Tamarind cooler','Rosé','Lebanese arak'],
  mediterranean:  ['Albariño','Vermentino','Olive-leaf tea','Cava','Bittered orange'],
  american:       ['Pilsner','Bourbon-citrus','Cold-brew tonic','Cider','Sparkling rosé'],
  korean:         ['Makgeolli','Soju spritz','Yuja honey tea','Crisp pilsner','Ginger ale'],
  vietnamese:     ['Vietnamese coffee','Lemongrass tea','Pilsner','Sparkling lime','Rosé'],
  caribbean:      ['Rum punch (NA)','Sorrel','Ginger beer','Tamarind cooler','Coconut water'],
  ethiopian:      ['Buna (coffee)','Tej','Hibiscus','Cardamom water','Honey wine (NA)'],
  spanish:        ['Tinto de verano','Cava','Vermouth','Sherry','Sangría blanca'],
};

function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]; }

function generateMenuName(cuisineIds) {
  if (cuisineIds.length > 1) {
    return `${pickRandom(FUSION_NAMES)} ${pickRandom(FUSION_TAILS)}`;
  }
  const parts = NAME_PARTS[cuisineIds[0]];
  if (!parts) return 'A Cruelty-Free Menu';
  return `${pickRandom(parts.a)} ${pickRandom(parts.b)}`;
}

function classify(recipe) {
  return {
    quick: parseInt(recipe.prep) <= 25,
    easy: recipe.difficulty <= 2,
    hero: recipe.difficulty >= 2 || recipe.cost >= 3.5,
  };
}

function generateMenu(cuisineIds, courses, dietIds) {
  const isFusion = cuisineIds.length > 1;
  const allowedCuisines = isFusion ? cuisineIds : cuisineIds;

  // Build pool, apply diet filters
  let pool = window.RECIPES.filter(r => cuisineIds.includes('all') || allowedCuisines.includes(r.cuisine));
  for (const dietId of dietIds) {
    const diet = DIETS.find(d => d.id === dietId);
    if (diet) pool = pool.filter(diet.match);
  }
  if (pool.length === 0) return null;

  const plan = COURSE_PLANS[courses];
  const used = new Set();
  const cuisineRotation = isFusion ? [...cuisineIds] : null;

  function pickFor(roleHints, courseIdx) {
    let candidates = pool.filter(r => !used.has(r.id));
    if (candidates.length === 0) candidates = [...pool];

    // In fusion mode, prefer the rotating cuisine for this course
    let preferredCuisine = null;
    if (isFusion) {
      preferredCuisine = cuisineRotation[courseIdx % cuisineRotation.length];
    }

    const scored = candidates.map(r => {
      const c = classify(r);
      let bonus = 0;
      if (roleHints.includes('quick') && c.quick) bonus += 0.3;
      if (roleHints.includes('easy') && c.easy) bonus += 0.2;
      if (roleHints.includes('hero') && c.hero) bonus += 0.4;
      if (preferredCuisine && r.cuisine === preferredCuisine) bonus += 0.6;
      return { r, score: Math.random() + bonus };
    });
    scored.sort((a, b) => b.score - a.score);
    const choice = scored[0].r;
    used.add(choice.id);
    return choice;
  }

  const picked = plan.map((course, i) => {
    const recipe = pickFor(course.pickFrom, i);
    const pairings = PAIRING_BY_CUISINE[recipe.cuisine] || PAIRING_BY_CUISINE.american;
    return {
      courseKey: course.key,
      courseLabel: course.label,
      recipe,
      pairing: pickRandom(pairings),
    };
  });

  const cuisineDisplay = isFusion
    ? cuisineIds.map(id => window.CUISINES.find(c => c.id === id)?.name).join(' × ')
    : cuisineIds[0] === 'all' ? 'Cross-cultural' : window.CUISINES.find(c => c.id === cuisineIds[0]).name;

  const cuisineTagDisplay = isFusion
    ? 'Fusion · cruelty-free, restaurant-grade'
    : cuisineIds[0] === 'all' ? 'Cruelty-free, restaurant-grade' : window.CUISINES.find(c => c.id === cuisineIds[0]).tag;

  return {
    cuisineIds,
    cuisineName: cuisineDisplay,
    cuisineTag: cuisineTagDisplay,
    isFusion,
    name: generateMenuName(cuisineIds.includes('all') ? ['american'] : cuisineIds),
    courses: picked,
    diets: dietIds,
    generatedAt: new Date(),
    id: 'm' + Date.now() + '_' + Math.floor(Math.random() * 10000),
  };
}

function swapCourse(menu, courseIdx) {
  const cuisineIds = menu.cuisineIds;
  let pool = cuisineIds.includes('all') ? window.RECIPES : window.RECIPES.filter(r => cuisineIds.includes(r.cuisine));
  for (const dietId of menu.diets || []) {
    const diet = DIETS.find(d => d.id === dietId);
    if (diet) pool = pool.filter(diet.match);
  }
  const used = new Set(menu.courses.map(c => c.recipe.id));
  const candidates = pool.filter(r => !used.has(r.id));
  if (candidates.length === 0) return menu;
  const next = candidates[Math.floor(Math.random() * candidates.length)];
  const pairings = PAIRING_BY_CUISINE[next.cuisine] || PAIRING_BY_CUISINE.american;
  const newCourses = menu.courses.map((c, i) =>
    i === courseIdx ? { ...c, recipe: next, pairing: pickRandom(pairings) } : c
  );
  return { ...menu, courses: newCourses };
}

// ---------- Components ----------

function SiteNav() {
  return (
    <header className="site-nav">
      <div className="brand">
        <div className="mark">A</div>
        <span>Animal Project Buddies</span>
      </div>
      <nav>
        <a href="#">Mission</a>
        <a href="#">Sanctuaries</a>
        <a href="menus.html" className="active">Menus</a>
        <a href="recipes.html">Recipes</a>
        <a href="#">Stories</a>
      </nav>
      <div className="right">
        <a href="recipes.html" className="menu-btn" style={{ textDecoration: 'none' }}>
          Browse recipes →
        </a>
      </div>
    </header>
  );
}

function MenusHero() {
  return (
    <section className="menus-hero">
      <div className="eyebrow">
        <span className="dot" />
        Menus · Composed for restaurant kitchens
      </div>
      <h1>A whole menu, <em>composed</em> in seconds.</h1>
      <p className="lede">
        Pick one cuisine — or fuse two for a crossroads tasting. We'll arrange courses, suggest pairings, and cost every plate.
      </p>
    </section>
  );
}

function Generator({ cuisines, courses, servings, diets, onCuisineToggle, onCourses, onServings, onDietToggle, onMood, onGenerate }) {
  const fusion = cuisines.length > 1;
  return (
    <div className="generator">
      <div className="generator-grid">
        <div className="gen-stack">
          <div className="gen-row">
            <div className="lbl">
              Cuisine
              {fusion && <span className="ct">Fusion · {cuisines.length}</span>}
            </div>
            <div className="pills">
              {window.CUISINES.filter(c => c.id !== 'all').map(c => (
                <button
                  key={c.id}
                  className={"pill" + (cuisines.includes(c.id) ? ' active' : '') + (fusion && cuisines.includes(c.id) ? ' fusion-pill' : '')}
                  onClick={() => onCuisineToggle(c.id)}
                >{c.name}</button>
              ))}
            </div>
          </div>

          <div className="gen-row">
            <div className="lbl">Mood preset</div>
            <div className="moods">
              {MOODS.map(m => (
                <button key={m.id} className="mood-chip" onClick={() => onMood(m)}>
                  <span className="ic">{m.ic}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="gen-row" style={{ flexDirection: 'row', gap: 32, flexWrap: 'wrap' }}>
            <div className="gen-row" style={{ minWidth: 160 }}>
              <span className="lbl">Courses</span>
              <div className="seg">
                {[3, 4, 5, 7].map(n => (
                  <button key={n} className={courses === n ? 'on' : ''} onClick={() => onCourses(n)}>{n}</button>
                ))}
              </div>
            </div>
            <div className="gen-row" style={{ minWidth: 200 }}>
              <span className="lbl">Service size</span>
              <div className="stepper">
                <button onClick={() => onServings(Math.max(2, servings - 4))}>−</button>
                <span className="v">{servings} guests</span>
                <button onClick={() => onServings(servings + 4)}>+</button>
              </div>
            </div>
            <div className="gen-row" style={{ minWidth: 200 }}>
              <span className="lbl">Dietary</span>
              <div className="diet-row">
                {DIETS.map(d => (
                  <button
                    key={d.id}
                    className={"diet-chip" + (diets.includes(d.id) ? ' on' : '')}
                    onClick={() => onDietToggle(d.id)}
                  >{d.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button className="gen-btn" onClick={onGenerate}>
          <span className="die">⟳</span>
          Generate menu
        </button>
      </div>
    </div>
  );
}

function MenuCard({ menu, servings, onSwap, fading }) {
  if (!menu) return null;
  const totalPerGuest = menu.courses.reduce((s, c) => s + c.recipe.cost, 0);
  const totalAll = totalPerGuest * servings;
  const avgPerCourse = totalPerGuest / menu.courses.length;
  const dateStr = menu.generatedAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="menu-stage">
      <div className={"menu-card" + (fading ? ' fading' : '')}>
        <div className="menu-crest">
          <span className="badge">{menu.isFusion ? '✦  Fusion menu' : '✦  Sample menu'}</span>
          <span style={{ color: 'oklch(0.96 0.015 85 / 0.6)' }}>{dateStr}</span>
          <div className="nums">
            <span>Cuisine <b>{menu.cuisineName}</b></span>
            <span>Courses <b>{menu.courses.length}</b></span>
            <span>Guests <b>{servings}</b></span>
          </div>
        </div>

        <div className="menu-head">
          <div className="ornament"><span className="l" />{menu.cuisineTag}<span className="l" /></div>
          <h2>{menu.name}</h2>
          <div className="sub">A composed plant-based tasting</div>
          <div className="price-row">
            <div className="pi">
              <div className="v accent">${avgPerCourse.toFixed(2)}</div>
              <div className="l">Avg / course</div>
            </div>
            <div className="pi">
              <div className="v">${totalPerGuest.toFixed(2)}</div>
              <div className="l">Per guest</div>
            </div>
            <div className="pi">
              <div className="v">${totalAll.toFixed(0)}</div>
              <div className="l">Total · {servings} guests</div>
            </div>
            <div className="pi">
              <div className="v">{menu.courses.reduce((s, c) => s + parseInt(c.recipe.prep), 0)}m</div>
              <div className="l">Combined prep</div>
            </div>
          </div>
        </div>

        <div className="courses">
          {menu.courses.map((c, i) => (
            <div className="course" key={i}>
              <div className="num">{String(i + 1).padStart(2, '0')}</div>
              <div className="info">
                <div className="label">
                  {c.courseLabel}
                  {menu.isFusion && <span className="from">{c.recipe.cuisineName}</span>}
                </div>
                <h4>{c.recipe.title}</h4>
                {c.recipe.source && <div className="src">{c.recipe.source}</div>}
                <div className="why">{c.recipe.why}</div>
                <div className="pairing">Pair with {c.pairing}</div>
              </div>
              <div className="price">${c.recipe.cost.toFixed(2)}</div>
              <button className="swap-fab" onClick={() => onSwap(i)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>
                Swap course
              </button>
            </div>
          ))}
        </div>

        <div className="menu-foot">
          <span>Cruelty-free · restaurant-grade · printed on recycled stock</span>
          <div className="actions">
            <button>Print menu</button>
            <button>Share link</button>
            <button className="primary">Save & customize</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function History({ items, activeId, onPick }) {
  if (items.length === 0) return null;
  return (
    <div className="history">
      {items.map(m => {
        const total = m.courses.reduce((s, c) => s + c.recipe.cost, 0);
        return (
          <div key={m.id} className={"hcard" + (m.id === activeId ? ' active' : '')} onClick={() => onPick(m)}>
            <div className="ht">{m.cuisineName} · {m.courses.length} course</div>
            <div className="hn">{m.name}</div>
            <div className="hp">${total.toFixed(2)} / guest</div>
          </div>
        );
      })}
    </div>
  );
}

function Tips() {
  return (
    <div className="tips">
      <div className="tip">
        <div className="num">i.</div>
        <h5>Fuse two cuisines</h5>
        <p>Pick more than one and the generator alternates courses across them, naming the menu accordingly. Crossroads tastings make memorable nights.</p>
      </div>
      <div className="tip">
        <div className="num">ii.</div>
        <h5>Swap, don't restart</h5>
        <p>Hover any course and tap "swap" — we'll find a new dish in the same role and cuisine. Other courses, costs, and pairings stay put.</p>
      </div>
      <div className="tip">
        <div className="num">iii.</div>
        <h5>Costs are food-only, per guest</h5>
        <p>Wholesale ingredient cost. Doesn't include labor, overhead, or beverage pairing — those are noted in italics under each course.</p>
      </div>
    </div>
  );
}

function App() {
  const [cuisines, setCuisines] = useState(['italian']);
  const [courses, setCourses] = useState(4);
  const [servings, setServings] = useState(40);
  const [diets, setDiets] = useState([]);
  const [menu, setMenu] = useState(() => generateMenu(['italian'], 4, []));
  const [history, setHistory] = useState([]);
  const [fading, setFading] = useState(false);

  function toggleCuisine(id) {
    setCuisines(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // require at least one
        return prev.filter(c => c !== id);
      }
      // Limit fusion to 3 cuisines
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  function toggleDiet(id) {
    setDiets(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  }

  function applyMood(m) {
    setCourses(m.courses);
    setServings(m.servings);
  }

  function handleGenerate() {
    setFading(true);
    setTimeout(() => {
      const next = generateMenu(cuisines, courses, diets);
      setMenu(next);
      setHistory(prev => [next, ...prev].slice(0, 8));
      setFading(false);
    }, 240);
  }

  function handleSwap(idx) {
    if (!menu) return;
    setMenu(swapCourse(menu, idx));
  }

  function handlePickHistory(m) {
    setMenu(m);
    setCuisines(m.cuisineIds);
    setCourses(m.courses.length);
    setDiets(m.diets || []);
  }

  // Auto-regen when cuisines / courses / diets change (without history)
  useEffect(() => {
    setMenu(generateMenu(cuisines, courses, diets));
  // eslint-disable-next-line
  }, [cuisines.join(','), courses, diets.join(',')]);

  return (
    <>
      <SiteNav />
      <MenusHero />
      <Generator
        cuisines={cuisines}
        courses={courses}
        servings={servings}
        diets={diets}
        onCuisineToggle={toggleCuisine}
        onCourses={setCourses}
        onServings={setServings}
        onDietToggle={toggleDiet}
        onMood={applyMood}
        onGenerate={handleGenerate}
      />
      <MenuCard menu={menu} servings={servings} onSwap={handleSwap} fading={fading} />
      {history.length > 0 && <History items={history} activeId={menu?.id} onPick={handlePickHistory} />}
      <Tips />
      <footer className="foot" style={{ marginTop: 0 }}>
        Animal Project Buddies · Sample menus are starting points — tune cost, courses, and dishes to your kitchen
      </footer>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
