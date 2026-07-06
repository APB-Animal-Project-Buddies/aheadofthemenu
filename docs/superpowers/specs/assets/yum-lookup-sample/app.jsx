// === Yum Lookup ===
// Vegan dish reverse lookup with cute rating system + leaderboards

const { useState, useMemo, useEffect, useRef } = React;

// ============================================================
// DATA
// ============================================================

// Each entry = ONE menu item at ONE restaurant. Same dish at different
// spots gets its own card with its own scores.
const DISHES = [
  {
    id: "milkshake-nlb",
    dishName: "Sugar Cookie Milkshake",
    searchTerms: ["milkshake"],
    category: "drink",
    restaurant: { name: "Next Level Burger", neighborhood: "Fremont", address: "1401 NW 46th St Suite 126, Seattle, WA 98107" },
    description: "Thick dairy-free milkshakes with a rotating flavor selection. Pick your base milk at order time.",
    flavors: ["Vanilla", "Chocolate", "Strawberry", "Sugar Cookie"],
    ingredients: ["dairy-free ice cream", "soy milk (option)", "oat milk (option)"],
    allergens: [{ name: "Soy", optional: true }, { name: "Coconut", optional: true }],
    chefScore: 78,
    dinerScore: 86,
    dinerCount: 318,
  },
  {
    id: "milkshake-vvb",
    dishName: "Vanilla and Date Milkshake",
    searchTerms: ["milkshake"],
    category: "drink",
    locallyMade: true,
    restaurant: { name: "Vital Vegan Bistro", neighborhood: "Capitol Hill", address: "1521 E Olive Way, Seattle, WA 98122", note: "House-made oat cream blended fresh per order." },
    description: "Medjool dates and Madagascar vanilla blended into a house oat cream base. Finished with a pinch of flaked salt.",
    ingredients: ["medjool dates", "house oat cream", "madagascar vanilla", "flaked salt"],
    allergens: [],
    chefScore: 91,
    dinerScore: 93,
    dinerCount: 124,
  },
  {
    id: "milkshake-cycledog",
    dishName: "Cookies & Cream Shake",
    searchTerms: ["milkshake"],
    category: "drink",
    restaurant: { name: "Cycle Dogs", neighborhood: "Georgetown", address: "5101 Corson Ave S, Seattle, WA 98108" },
    description: "Crushed chocolate sandwich cookies blended into a vanilla coconut-soft-serve shake. Topped with whip.",
    ingredients: ["coconut soft serve", "chocolate sandwich cookies", "soy whip"],
    allergens: [{ name: "Soy" }, { name: "Gluten" }, { name: "Coconut" }],
    chefScore: 72,
    dinerScore: 81,
    dinerCount: 206,
  },
  {
    id: "burrito-threecats",
    dishName: "Breakfast Burrito",
    searchTerms: ["breakfast burrito", "burrito"],
    category: "breakfast",
    locallyMade: true,
    restaurant: { name: "Three Cats Cafe", neighborhood: "Woodinville", address: "17410 133rd Ave NE, Suite 101, Woodinville, WA 98072", note: "Located inside Woodinville Bodega." },
    description: "Puff-pastry-wrapped breakfast burrito with hash browns, tofu, turmeric, green pepper, and asparagus. Locally made.",
    ingredients: ["puff pastry", "tortilla", "hash browns", "tofu", "turmeric", "green pepper", "asparagus"],
    allergens: [{ name: "Gluten" }, { name: "Soy" }],
    chefScore: 94,
    dinerScore: 89,
    dinerCount: 142,
  },
  {
    id: "burrito-plum",
    dishName: "Chorizo Sunrise Burrito",
    searchTerms: ["breakfast burrito", "burrito"],
    category: "breakfast",
    restaurant: { name: "Plum Bistro", neighborhood: "Capitol Hill", address: "1429 12th Ave, Seattle, WA 98122" },
    description: "Soyrizo scramble, crispy potatoes, charred poblano, and cashew queso in a flour tortilla. Salsa verde on the side.",
    ingredients: ["soyrizo", "tofu scramble", "crispy potato", "poblano", "cashew queso", "flour tortilla"],
    allergens: [{ name: "Soy" }, { name: "Gluten" }, { name: "Tree nuts" }],
    chefScore: 87,
    dinerScore: 84,
    dinerCount: 98,
  },
  {
    id: "shawarma-plum",
    dishName: "Mushroom Shawarma Wrap",
    searchTerms: ["shawarma", "wrap"],
    category: "savoury",
    restaurant: { name: "Plum Bistro", neighborhood: "Capitol Hill", address: "1429 12th Ave, Seattle, WA 98122" },
    description: "King oyster mushrooms marinated in baharat, slow-roasted on the spit, wrapped with toum and pickles.",
    ingredients: ["king oyster mushroom", "baharat", "garlic toum", "pickles", "lavash"],
    allergens: [{ name: "Gluten" }, { name: "Sesame" }],
    chefScore: 91,
    dinerScore: 93,
    dinerCount: 207,
  },
  {
    id: "tart-arayas",
    dishName: "Dark Chocolate Tart",
    searchTerms: ["dessert", "tart", "chocolate"],
    category: "dessert",
    locallyMade: true,
    restaurant: { name: "Araya's Place", neighborhood: "U District", address: "5240 University Way NE, Seattle, WA 98105" },
    description: "Bittersweet chocolate ganache in an almond cocoa crust, finished with maldon and olive oil.",
    ingredients: ["dark chocolate", "almond flour", "coconut cream", "olive oil", "maldon salt"],
    allergens: [{ name: "Tree nuts" }, { name: "Coconut" }],
    chefScore: 88,
    dinerScore: 82,
    dinerCount: 64,
  },
  {
    id: "larb-veggiegrill",
    dishName: "Crispy Tofu Larb",
    searchTerms: ["tofu", "larb"],
    category: "savoury",
    restaurant: { name: "Veggie Grill", neighborhood: "South Lake Union", address: "446 Terry Ave N, Seattle, WA 98109" },
    description: "Crumbled crispy tofu with toasted rice powder, mint, shallots, lime, and bird's eye chili. Served with cabbage cups.",
    ingredients: ["tofu", "toasted rice", "mint", "shallot", "lime", "thai chili"],
    allergens: [{ name: "Soy" }],
    chefScore: 67,
    dinerScore: 71,
    dinerCount: 89,
  },
];

// === PIZZA LEADERBOARD ===
// Fictional names for the leaderboard so we don't lift real branding
const PIZZA_LEADERBOARD = [
  { id: "p1", name: "The Garden Patch Pie", restaurant: "Slice & Vine", neighborhood: "Capitol Hill", chefScore: 96, dinerScore: 94, upvotes: 412, downvotes: 18, blurb: "Wood-fired with house cashew mozz, heirloom tomato, basil." },
  { id: "p2", name: "Smoked Mushroom Detroit", restaurant: "Crust Republic", neighborhood: "Ballard", chefScore: 92, dinerScore: 95, upvotes: 388, downvotes: 22, blurb: "Twice-smoked crimini, vegan brick, crisp cheese frico edge." },
  { id: "p3", name: "Pesto Verde Slice", restaurant: "Doughboys Vegan", neighborhood: "Fremont", chefScore: 89, dinerScore: 91, upvotes: 341, downvotes: 31, blurb: "Bright basil pesto, marinated artichoke, smoked almond ricotta." },
  { id: "p4", name: "Sourdough Margherita", restaurant: "Old North Bakery", neighborhood: "Phinney Ridge", chefScore: 90, dinerScore: 87, upvotes: 296, downvotes: 28, blurb: "72-hour sourdough crust, San Marzano, fresh tofu mozzarella." },
  { id: "p5", name: "Spicy Soppressata (V)", restaurant: "Plant Slice Co.", neighborhood: "Beacon Hill", chefScore: 85, dinerScore: 88, upvotes: 274, downvotes: 35, blurb: "House-made plant pepperoni, hot honey drizzle, chili crisp." },
  { id: "p6", name: "Cacio e Pepe Bianca", restaurant: "Verdant Crust", neighborhood: "Wallingford", chefScore: 84, dinerScore: 82, upvotes: 198, downvotes: 41, blurb: "White pie with cashew pecorino, cracked black pepper, lemon zest." },
  { id: "p7", name: "Roasted Squash Autumn Pie", restaurant: "The Mighty Pie", neighborhood: "West Seattle", chefScore: 81, dinerScore: 84, upvotes: 172, downvotes: 33, blurb: "Honeynut squash, sage, caramelized onion, maple balsamic." },
  { id: "p8", name: "BBQ Jackfruit Slice", restaurant: "Crown Hill Pies", neighborhood: "Crown Hill", chefScore: 76, dinerScore: 79, upvotes: 156, downvotes: 48, blurb: "Slow-cooked jackfruit, pickled red onion, smoky BBQ swirl." },
  { id: "p9", name: "Build-Your-Own", restaurant: "Pizza Pi Vegan", neighborhood: "U District", chefScore: 72, dinerScore: 77, upvotes: 134, downvotes: 52, blurb: "All-vegan menu, build it however weird you want." },
  { id: "p10", name: "Buffalo Cauliflower Pie", restaurant: "Slice & Vine", neighborhood: "Capitol Hill", chefScore: 70, dinerScore: 74, upvotes: 98, downvotes: 41, blurb: "Crispy buffalo cauli, ranch drizzle, celery, blue 'cheese' crumble." },
];

const BURGER_LEADERBOARD = [
  { id: "b1", name: "The Smashed Classic", restaurant: "Next Level Burger", neighborhood: "Fremont", chefScore: 93, dinerScore: 90, upvotes: 367, downvotes: 24, blurb: "Double-stacked smash patties, house American, special sauce." },
  { id: "b2", name: "Mushroom Melt", restaurant: "No Bones Beach Club", neighborhood: "Ballard", chefScore: 89, dinerScore: 91, upvotes: 312, downvotes: 27, blurb: "Roasted portobello, caramelized onion, gruyère-style cashew cheese." },
  { id: "b3", name: "Beet Burger Deluxe", restaurant: "Plum Burgers", neighborhood: "Capitol Hill", chefScore: 86, dinerScore: 84, upvotes: 245, downvotes: 39, blurb: "House beet-quinoa patty, dill yogurt, pickled onions, arugula." },
  { id: "b4", name: "Buffalo Chick'n", restaurant: "Veggie Grill", neighborhood: "South Lake Union", chefScore: 82, dinerScore: 86, upvotes: 218, downvotes: 33, blurb: "Crispy plant chick'n, buffalo glaze, herby ranch, slaw." },
  { id: "b5", name: "Black Bean Verde", restaurant: "Cycle Dogs", neighborhood: "Georgetown", chefScore: 78, dinerScore: 81, upvotes: 174, downvotes: 41, blurb: "Spicy black bean patty, salsa verde, avocado, queso." },
  { id: "b6", name: "The Big Crunch", restaurant: "Wayward Vegan Cafe", neighborhood: "U District", chefScore: 74, dinerScore: 76, upvotes: 142, downvotes: 38, blurb: "Crispy seitan patty, tomato, lettuce, dijonnaise on brioche." },
];

const PASTA_LEADERBOARD = [
  { id: "pa1", name: "Cacio e Pepe Rigatoni", restaurant: "Plum Bistro", neighborhood: "Capitol Hill", chefScore: 94, dinerScore: 92, upvotes: 287, downvotes: 16, blurb: "Cashew pecorino, fresh-cracked Tellicherry pepper, fat rigatoni." },
  { id: "pa2", name: "Mushroom Bolognese", restaurant: "Harvest Beat", neighborhood: "Phinney Ridge", chefScore: 91, dinerScore: 89, upvotes: 234, downvotes: 21, blurb: "Slow-simmered mushroom & lentil ragù over hand-cut pappardelle." },
  { id: "pa3", name: "Lemon Pea Orecchiette", restaurant: "Verdant Crust", neighborhood: "Wallingford", chefScore: 87, dinerScore: 85, upvotes: 189, downvotes: 28, blurb: "Spring peas, preserved lemon, mint, cashew cream, chili crisp." },
  { id: "pa4", name: "Spicy Vodka Penne", restaurant: "Sugo Vegan", neighborhood: "Pioneer Square", chefScore: 84, dinerScore: 88, upvotes: 167, downvotes: 31, blurb: "Tomato vodka cream, calabrian chili, basil, plant parm." },
  { id: "pa5", name: "Garlic Confit Linguine", restaurant: "Doughboys Vegan", neighborhood: "Fremont", chefScore: 79, dinerScore: 82, upvotes: 134, downvotes: 35, blurb: "Olive oil, slow-confit garlic cloves, chili flake, lemon, parsley." },
];

const LEADERBOARDS = {
  pizza: { title: "Best Pizza", emoji: "Pizza", items: PIZZA_LEADERBOARD },
  burger: { title: "Best Burger", emoji: "Burger", items: BURGER_LEADERBOARD },
  pasta: { title: "Best Pasta", emoji: "Pasta", items: PASTA_LEADERBOARD },
};

// ============================================================
// HELPERS
// ============================================================

// Score → mood tier
function moodFor(score) {
  if (score >= 90) return { key: "love", label: "Top Bite", color: "#3F8F5A", soft: "#E8F2EA", face: "love" };
  if (score >= 80) return { key: "yum", label: "Yum",      color: "#6BA84A", soft: "#EEF3E0", face: "happy" };
  if (score >= 70) return { key: "tasty", label: "Tasty",  color: "#CFA017", soft: "#FAF1D2", face: "smile" };
  if (score >= 55) return { key: "meh", label: "Meh",      color: "#D17B3A", soft: "#FCE9D9", face: "neutral" };
  return { key: "skip", label: "Skip",                     color: "#C95B4F", soft: "#FBDDD7", face: "sad" };
}

// Cute SVG face — simple geometric primitives
function CuteFace({ mood = "happy", size = 44, fill = "#FFD980", stroke = "#1C3A2E" }) {
  // mood → mouth path
  const mouths = {
    love:    "M 14 26 Q 22 36 30 26",
    happy:   "M 14 25 Q 22 32 30 25",
    smile:   "M 15 26 Q 22 30 29 26",
    neutral: "M 15 28 L 29 28",
    sad:     "M 15 30 Q 22 24 29 30",
  };
  const eye = mood === "love" ? "heart" : "dot";
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} style={{ display: "block" }}>
      <circle cx="22" cy="22" r="20" fill={fill} stroke={stroke} strokeWidth="2" />
      {/* cheeks for happier moods */}
      {(mood === "love" || mood === "happy") && (
        <g opacity="0.55">
          <circle cx="11" cy="26" r="2.6" fill="#E89A8E" />
          <circle cx="33" cy="26" r="2.6" fill="#E89A8E" />
        </g>
      )}
      {/* eyes */}
      {eye === "heart" ? (
        <g fill={stroke}>
          <path d="M14 16 a2.4 2.4 0 0 1 4 0 a2.4 2.4 0 0 1 4 0 q 0 3 -4 5.4 q -4 -2.4 -4 -5.4 z" transform="translate(-3 -1)" />
          <path d="M14 16 a2.4 2.4 0 0 1 4 0 a2.4 2.4 0 0 1 4 0 q 0 3 -4 5.4 q -4 -2.4 -4 -5.4 z" transform="translate(11 -1)" />
        </g>
      ) : (
        <g fill={stroke}>
          <circle cx="15" cy="18" r="2.2" />
          <circle cx="29" cy="18" r="2.2" />
          {mood === "sad" && (
            <g stroke={stroke} strokeWidth="1.4" strokeLinecap="round">
              <line x1="12" y1="14" x2="18" y2="16" />
              <line x1="26" y1="16" x2="32" y2="14" />
            </g>
          )}
        </g>
      )}
      {/* mouth */}
      <path d={mouths[mood]} stroke={stroke} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* little leaf sprig for vegan flair */}
      <g transform="translate(32 2)">
        <path d="M0 6 Q 3 -2 9 0 Q 7 6 0 6 Z" fill="#7BB069" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
        <line x1="0" y1="6" x2="9" y2="0" stroke={stroke} strokeWidth="0.8" />
      </g>
    </svg>
  );
}

function Pill({ children, dot, dotColor = "#E85A4F", style, ...rest }) {
  return (
    <span className="pill" style={style} {...rest}>
      {dot && <span className="pill-dot" style={{ background: dotColor }} />}
      {children}
    </span>
  );
}

// ============================================================
// YUM METER — the prominent rating block
// ============================================================

function YumMeter({ chefScore, dinerScore, dinerCount, compact = false }) {
  const chefMood = moodFor(chefScore);
  const dinerMood = moodFor(dinerScore);
  const combined = Math.round((chefScore + dinerScore) / 2);
  const headline = moodFor(combined);

  return (
    <div className={`yum-meter ${compact ? "compact" : ""}`}>
      <div className="yum-score" style={{ background: chefMood.soft }}>
        <div className="yum-score-face">
          <CuteFace mood={chefMood.face} fill={chefMood.color === "#3F8F5A" ? "#A6D8B0" : chefMood.color === "#6BA84A" ? "#C8E0A0" : chefMood.color === "#CFA017" ? "#FFE08A" : chefMood.color === "#D17B3A" ? "#F4B987" : "#F2A39A"} />
        </div>
        <div className="yum-score-body">
          <div className="yum-score-label">CHEFS SAY</div>
          <div className="yum-score-num" style={{ color: chefMood.color }}>
            {chefScore}<span className="yum-score-pct">%</span>
          </div>
          <div className="yum-score-mood" style={{ color: chefMood.color }}>{chefMood.label}</div>
        </div>
      </div>

      <div className="yum-score" style={{ background: dinerMood.soft }}>
        <div className="yum-score-face">
          <CuteFace mood={dinerMood.face} fill={dinerMood.color === "#3F8F5A" ? "#A6D8B0" : dinerMood.color === "#6BA84A" ? "#C8E0A0" : dinerMood.color === "#CFA017" ? "#FFE08A" : dinerMood.color === "#D17B3A" ? "#F4B987" : "#F2A39A"} />
        </div>
        <div className="yum-score-body">
          <div className="yum-score-label">DINERS SAY</div>
          <div className="yum-score-num" style={{ color: dinerMood.color }}>
            {dinerScore}<span className="yum-score-pct">%</span>
          </div>
          <div className="yum-score-mood" style={{ color: dinerMood.color }}>
            {dinerMood.label}{dinerCount ? <span className="yum-score-count"> · {dinerCount} reviews</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BROWSE PAGE
// ============================================================

const CATEGORIES = ["All", "breakfast", "burrito", "dessert", "drink", "savoury", "sweet"];

function BrowsePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    return DISHES.filter(d => {
      if (category !== "All" && d.category !== category) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        d.dishName.toLowerCase().includes(q) ||
        (d.searchTerms || []).some(t => t.toLowerCase().includes(q)) ||
        d.restaurant.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.ingredients || []).some(i => i.toLowerCase().includes(q)) ||
        (d.flavors || []).some(f => f.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  return (
    <div className="browse">
      <div className="city-bar">
        <Pill dot>Seattle area</Pill>
        <span className="city-bar-note">· more cities coming</span>
      </div>

      <label className="search">
        <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          type="text"
          placeholder='Try "breakfast burrito, tofu, milkshake..."'
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <span className="search-count">{filtered.length} dish{filtered.length === 1 ? "" : "es"}</span>
      </label>

      <div className="category-row">
        <span className="category-label">CATEGORY</span>
        <div className="category-pills">
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`cat-pill ${category === c ? "active" : ""}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="dish-list">
        {filtered.map(d => <DishCard key={d.id} dish={d} />)}
        {filtered.length === 0 && (
          <div className="empty">
            <CuteFace mood="neutral" size={64} fill="#F4B987" />
            <p>No dishes match. Try a broader search?</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DishCard({ dish }) {
  return (
    <article className="dish-card" data-screen-label={`${dish.restaurant.name} — ${dish.dishName}`}>
      <header className="dish-head">
        <div className="dish-head-main">
          <div className="dish-title-row">
            <h2 className="dish-title">{dish.dishName}</h2>
            {dish.locallyMade && <Pill dot dotColor="#D97757">LOCALLY MADE</Pill>}
          </div>
          <div className="dish-restaurant">
            <span className="dish-restaurant-from">from</span>
            <strong>{dish.restaurant.name}</strong>
            <span className="dish-restaurant-hood">· {dish.restaurant.neighborhood}</span>
          </div>
        </div>
        <span className="dish-cat">{dish.category.toUpperCase()}</span>
      </header>

      <YumMeter chefScore={dish.chefScore} dinerScore={dish.dinerScore} dinerCount={dish.dinerCount} />

      <p className="dish-desc">{dish.description}</p>

      {dish.flavors && (
        <div className="dish-row">
          <span className="row-label">FLAVORS</span>
          <div className="row-pills">
            {dish.flavors.map(f => <span key={f} className="tag">{f}</span>)}
          </div>
        </div>
      )}

      {dish.ingredients && (
        <div className="dish-row">
          <span className="row-label">KEY INGREDIENTS</span>
          <div className="row-pills">
            {dish.ingredients.map(i => <span key={i} className="tag tag-outline">{i}</span>)}
          </div>
        </div>
      )}

      {dish.allergens && dish.allergens.length > 0 && (
        <div className="dish-row">
          <span className="row-label">ALLERGENS</span>
          <div className="row-pills">
            {dish.allergens.map(a => (
              <span key={a.name} className="tag tag-allergen">
                {a.name}
                {a.optional && <span className="tag-meta">OPTIONAL</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="dish-foot">
        <div className="dish-addr">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>{dish.restaurant.address}</span>
        </div>
        {dish.restaurant.note && <div className="dish-addr-note">{dish.restaurant.note}</div>}
      </div>
    </article>
  );
}

// ============================================================
// LEADERBOARD PAGE
// ============================================================

function LeaderboardPage() {
  const [boardKey, setBoardKey] = useState("pizza");
  const [city] = useState("Seattle");
  const board = LEADERBOARDS[boardKey];

  // Rank by combined (chef + diner) score
  const ranked = useMemo(() => {
    return [...board.items]
      .map(it => ({ ...it, combined: Math.round((it.chefScore + it.dinerScore) / 2) }))
      .sort((a, b) => b.combined - a.combined);
  }, [board]);

  const totalReviews = ranked.reduce((s, i) => s + (i.upvotes + i.downvotes), 0);

  return (
    <div className="leaderboard">
      <div className="city-bar">
        <Pill dot>Seattle area</Pill>
        <span className="city-bar-note">· more cities coming</span>
      </div>

      <header className="lb-hero">
        <div className="lb-hero-text">
          <div className="lb-eyebrow">LEADERBOARD · UPDATED HOURLY</div>
          <h1 className="lb-title">{board.title} <span className="lb-title-loc">in {city}</span></h1>
          <p className="lb-sub">Ranked by {totalReviews.toLocaleString()} hungry humans plus a panel of local chefs. The highest combined score takes the crown.</p>
        </div>
        <div className="lb-hero-face">
          <CuteFace mood="love" size={92} fill="#FFC56B" />
        </div>
      </header>

      <div className="lb-filters">
        <span className="category-label">CATEGORY</span>
        <div className="category-pills">
          {Object.entries(LEADERBOARDS).map(([k, b]) => (
            <button
              key={k}
              className={`cat-pill ${boardKey === k ? "active" : ""}`}
              onClick={() => setBoardKey(k)}
            >
              {b.title.replace("Best ", "")}
            </button>
          ))}
        </div>
      </div>

      <ol className="lb-list">
        {ranked.map((it, idx) => {
          const mood = moodFor(it.combined);
          const chefMood = moodFor(it.chefScore);
          const dinerMood = moodFor(it.dinerScore);
          const isTop = idx === 0;
          return (
            <li key={it.id} className={`lb-row ${isTop ? "top" : ""}`}>
              <div className="lb-rank">
                <span className="lb-rank-num">{idx + 1}</span>
                {isTop && <span className="lb-rank-crown">CHAMP</span>}
              </div>

              <div className="lb-thumb" style={{ background: mood.soft }}>
                <CuteFace mood={mood.face} size={56} fill={mood.color === "#3F8F5A" ? "#A6D8B0" : mood.color === "#6BA84A" ? "#C8E0A0" : "#FFE08A"} />
              </div>

              <div className="lb-main">
                <div className="lb-name-row">
                  <h3 className="lb-name">{it.name}</h3>
                </div>
                <div className="lb-meta">
                  <strong>{it.restaurant}</strong> · {it.neighborhood}
                </div>
                <p className="lb-blurb">{it.blurb}</p>
              </div>

              <div className="lb-scores">
                <div className="lb-score-block" style={{ background: chefMood.soft }}>
                  <div className="lb-score-num" style={{ color: chefMood.color }}>
                    {it.chefScore}<span className="lb-score-pct">%</span>
                  </div>
                  <div className="lb-score-label">CRITICS</div>
                </div>
                <div className="lb-score-block" style={{ background: dinerMood.soft }}>
                  <div className="lb-score-num" style={{ color: dinerMood.color }}>
                    {it.dinerScore}<span className="lb-score-pct">%</span>
                  </div>
                  <div className="lb-score-label">DINERS</div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="lb-foot">
        Rankings refresh every hour. <a href="#" onClick={e => e.preventDefault()}>Suggest a dish →</a>
      </footer>
    </div>
  );
}

// ============================================================
// APP SHELL
// ============================================================

function App() {
  const [page, setPage] = useState(() => {
    const h = window.location.hash.replace("#", "");
    return h === "leaderboard" ? "leaderboard" : "browse";
  });

  useEffect(() => {
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <div className="app">
      <nav className="topbar">
        <div className="brand" onClick={() => setPage("browse")}>
          <span className="brand-mark">
            <CuteFace mood="love" size={32} fill="#FFC56B" />
          </span>
          <span className="brand-name">Yum Lookup</span>
          <span className="brand-sub">vegan, but make it joyful</span>
        </div>
        <div className="nav-links">
          <button className={`nav-link ${page === "browse" ? "active" : ""}`} onClick={() => setPage("browse")}>Browse</button>
          <button className={`nav-link ${page === "leaderboard" ? "active" : ""}`} onClick={() => setPage("leaderboard")}>Leaderboards</button>
        </div>
      </nav>

      <main className="page" data-screen-label={page === "browse" ? "Browse" : "Leaderboards"}>
        {page === "browse" ? <BrowsePage /> : <LeaderboardPage />}
      </main>

      <div className="page-foot">
        Built for vegan-curious humans · <a href="#" onClick={e => { e.preventDefault(); setPage(page === "browse" ? "leaderboard" : "browse"); }}>{page === "browse" ? "See leaderboards →" : "← Back to browse"}</a>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
