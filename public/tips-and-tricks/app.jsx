// Tips & Tricks — the research behind plant-forward menus, and the concrete
// moves (guest-facing nudges + kitchen economics) that turn it into profit.
// Self-contained: no longer reads the vegan-restaurant-catalog data (that
// pipeline now only feeds /recipes). Content lives directly in this file.

const STATS = [
  { num: '27% vs 16%', label: 'of Gen Z & Millennials eat plant-based most of the time, against Boomers' },
  { num: '+25–108%', label: 'more orders from an appetising name alone' },
  { num: '20–40%', label: 'lower cost per portion: legumes, grains & mushrooms vs. meat' },
  { num: '+41–79%', label: 'more plant sales when you double the plant-based options' },
];

const LEVERS = [
  {
    icon: '🥘',
    title: 'Big profits on simple dishes',
    body: 'Many traditional plant-based foods are cheap — sub-$1.50 food costs that stay fresh for days, are easy to make, and sell at a high margin.',
    examples: ['Dal makhani', 'Mole poblano', 'Mujadara', 'Hummus'],
  },
  {
    icon: '🛡️',
    title: 'Fewer health-code scares',
    body: 'No raw meat means no salmonella, listeria or E. coli temperature-danger-zone violations from that station. Fewer contamination risks means fewer failed inspections, recalls and shutdown scares.',
  },
  {
    icon: '💰',
    title: 'Lower cost per plate',
    body: 'Legumes, grains, mushrooms and seasonal vegetables typically run 20–40% cheaper per portion than meat or fish — and they don’t swing with commodity protein and dairy prices.',
  },
  {
    icon: '🔁',
    title: 'Blended protein saves money',
    body: 'Blend finely chopped mushrooms into patties and stews at 25–30% and you cut your priciest ingredient while keeping — often improving — the flavour guests taste.',
  },
  {
    icon: '😊',
    title: 'Cheaper food, happier customers',
    body: 'Price the plant dish at or below its meat equivalent. Because it usually costs less to make, the volume it earns and the margin it carries compound in the same direction.',
  },
  {
    icon: '📦',
    title: 'Less spoilage, less waste',
    body: 'Dry legumes and grains keep for months, not days. Anchoring low-turnover dishes on shelf-stable staples instead of fresh meat and dairy cuts write-offs and gives the kitchen more slack.',
  },
  {
    icon: '🎯',
    title: 'Position for margin',
    body: 'Guests order what’s easiest to notice. Put the plant dish with the best margin where eyes land first — top of the section, boxed, chef’s favorite — so the highest-margin dish is also the most-ordered one.',
  },
];

const MOVES = [
  {
    n: 1,
    title: 'Focus on tasty titles',
    body: 'Name dishes for flavour, texture and provenance — the way you\'d talk about a dish you\'re proud of. “Smoky maple-glazed carrots” beats “healthy carrots.” Words like vegan, meat-free and healthy quietly read as compromise and suppress orders.',
    cite: 'Indulgent flavour names were chosen up to 41% more often; one curry renamed “Mild & Sweet Chickpea Curry” sold 108% better.',
  },
  {
    n: 2,
    title: 'Do NOT separate the menu',
    badge: 'Biggest mistake',
    body: 'A separate “Vegan / Veggie” box tells meat-eaters this isn\'t for them. Plant-rich dishes belong beside comparable animal ones, inside each course, on equal footing. Keep your (V) markers — guests need them, and allergen info is often a legal requirement — just move them to the end of the line so the food leads, not the label.',
    cite: 'Integrating plant dishes instead of a separate “vegetarian” section raised how often diners picked them by ~7 percentage points (Bacon & Krpan, 2018). Note: a menu-choice experiment, not till data.',
  },
  {
    n: 3,
    title: 'Be proud and plant-based',
    body: (
      <>
        Train the floor to genuinely recommend the plant-rich dishes and highlight them via
        &ldquo;Our Favorite&rdquo; sections on your menu — but make sure your staff loves what
        they&rsquo;re serving, since guests can tell if it&rsquo;s not a real recommendation.{' '}
        <a href="/dishes">Click here for inspiration</a>, and if you still can&rsquo;t genuinely
        recommend anything on your menu yet,{' '}
        <a href="mailto:aheadofthemenu@gmail.com?subject=Help%20with%20our%20plant-based%20dishes">
          reach out to us for help
        </a>.
      </>
    ),
  },
  {
    n: 4,
    title: 'Make meats add-ons',
    body: 'Flip the framing. Not “veggie burger (or add beef)” but “our signature mushroom-and-bean burger — make it beef +$2.” The plant version becomes the dish; the animal version becomes the deliberate opt-in.',
    cite: 'In a field trial, flipping the default took one dish from ~9% to 80% uptake, and another from 16% to 58%.',
  },
  {
    n: 5,
    title: 'Price plant-based dishes fairly',
    body: 'Don\'t try to charge more for plant-based dishes. An equivalent plant dish should cost the same or less than its animal counterpart — and oat milk shouldn\'t cost more than regular milk. A premium tells guests the plant option is a sacrifice, and it measurably discourages plant-based purchases.',
  },
  {
    n: 6,
    title: 'Have lots of options',
    body: 'More plant-based dishes on the menu means more get ordered — across starters, mains, sides, desserts and drinks, not just one.',
    cite: 'Across 90,000+ meals, doubling the share of plant-based options raised plant sales 41–79% and cut meat sales ~15 percentage points.',
  },
  {
    n: 7,
    title: 'Save money on the meat',
    body: 'Shrink the meat share per plate and fold in plant-based proteins without losing the taste. Finely chopped mushrooms folded into patties at 25–30% keep the juiciness guests order for. Aquafaba for eggs, plant milks for dairy, and legumes for extra protein.',
    cite: 'Mushroom-beef blends can read as more savoury than all-beef, not less.',
  },
  {
    n: 8,
    title: 'Make plant-rich eating feel abundant',
    body: 'Tie it together with generosity. Hero descriptions, tempting sides, a plant-forward special that changes with the season — the menu should make eating plants feel like a treat, not a box ticked.',
  },
  {
    n: 9,
    title: 'The Extra Mile',
    badge: 'Bonus move',
    badgeTone: 'accent',
    body: 'Once the first eight are working, go further. Reward plant-based orders through your loyalty program, build combo platters that lean plant-forward by default, or put the impact right on the menu next to the price — the water, carbon and animal lives a dish saves versus its meat-based counterpart.',
    cite: 'e.g. “Saves a life, 450 gallons of water, and 6kg of CO2 versus the beef version.” Guests remember a number next to a price far longer than a paragraph.',
  },
];

const SOURCES = [
  {
    href: 'https://globescan.com/2024/06/05/insight-of-the-week-plant-based-consumption-across-generations/',
    title: 'Plant-Based Consumption across Generations',
    src: 'GlobeScan “Grains of Truth” — 29,565 people, 31 markets (2023) — the generational split',
  },
  {
    href: 'https://pubmed.ncbi.nlm.nih.gov/29428546/',
    title: '(Not) Eating for the environment: restaurant menu design and vegetarian food choice',
    src: 'Bacon & Krpan, Appetite 125 (2018) 190-200 — the separate-section finding',
  },
  {
    href: 'https://www.wri.org/insights/its-all-name-how-boost-sales-plant-based-menu-items',
    title: 'It’s All in a Name: How to Boost the Sales of Plant-Based Menu Items',
    src: 'World Resources Institute — Better Buying Lab',
  },
  {
    href: 'https://www.pnas.org/doi/10.1073/pnas.1907207116',
    title: 'Impact of increasing vegetarian availability on meal selection and sales in cafeterias',
    src: 'Garnett et al., PNAS',
  },
  {
    href: 'https://www.sciencedirect.com/science/article/pii/S0195666322001404',
    title: 'A reversal of defaults: a menu-based default nudge for plant-based alternatives',
    src: 'Appetite — default-framing field trial',
  },
  {
    href: 'https://gfi.org/resource/promoting-plant-based-items-on-menus/',
    title: 'How to promote plant-based items on menus',
    src: 'Good Food Institute',
  },
  {
    href: 'https://www.mushroomcouncil.com/the-blend/',
    title: 'The Blend — mushroom & meat “protein flip”',
    src: 'Mushroom Council / Culinary Institute of America',
  },
  {
    href: 'https://www.betterfoodfoundation.org/research-and-reports/research-plant-based-defaults-work/',
    title: 'Why plant-based defaults work',
    src: 'Better Food Foundation — DefaultVeg',
  },
];

function LeverCard({ l }) {
  return (
    <article className="lever-card">
      <span className="lever-icon" aria-hidden="true">{l.icon}</span>
      <h3>{l.title}</h3>
      <p>{l.body}</p>
      {l.examples && (
        <ul className="lever-examples">
          {l.examples.map(e => <li key={e}>{e}</li>)}
        </ul>
      )}
    </article>
  );
}

function MoveCard({ m }) {
  return (
    <article className={'move-card' + (m.badge ? (m.badgeTone === 'accent' ? ' bonus' : ' flagged') : '')}>
      <div className="move-head">
        <div className="move-num">Move {m.n}</div>
        {m.badge && (
          <span className={'move-badge' + (m.badgeTone === 'accent' ? ' bonus' : '')}>{m.badge}</span>
        )}
      </div>
      <h3>{m.title}</h3>
      <p>{m.body}</p>
      {m.cite && <p className="cite">{m.cite}</p>}
    </article>
  );
}

function App() {
  return (
    <>
      <section className="tips-hero">
        <div className="trend-line">
          <span className="dot" />
          Gen Z and Millennials eat plant-based food most of the time at nearly twice the rate of Boomers &mdash; and the menus that meet them are the ones printing money.
        </div>
        <div className="eyebrow"><span className="dot" />Tips &amp; Tricks &middot; Research-backed, profit-focused</div>
        <h1>
          Make guests happier <em>and save yourself some money</em> while you&rsquo;re doing it.
        </h1>
        <div className="stat-strip">
          {STATS.map(s => (
            <div className="stat" key={s.label}>
              <div className="num">{s.num}</div>
              <div className="lbl">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="cta-row">
          <a className="tt-btn tt-btn-primary" href="#levers">See the profit levers</a>
          <a className="tt-btn tt-btn-secondary" href="#moves">See the eight moves</a>
        </div>
      </section>

      <section id="levers" className="lever-section">
        <div className="section-head">
          <div className="eyebrow-sm">Kitchen economics</div>
          <h2>Why you&rsquo;ll save money with plants</h2>
        </div>
        <div className="lever-grid">
          {LEVERS.map(l => <LeverCard l={l} key={l.title} />)}
        </div>
        <p className="section-note">
          Want a hand applying this to your own menu? <a href="/revamp#business">Get a Revamp</a> and we&rsquo;ll mark up your actual dishes.
        </p>
      </section>

      <section id="moves" className="moves-section">
        <div className="section-head">
          <div className="eyebrow-sm">The playbook</div>
          <h2>Eight moves, backed by research</h2>
        </div>
        <div className="moves-grid">
          {MOVES.map(m => <MoveCard m={m} key={m.n} />)}
        </div>
      </section>

      <section className="sources-section">
        <div className="section-head">
          <div className="eyebrow-sm">Go deeper</div>
          <h2>The research behind the moves</h2>
        </div>
        <ul className="sources">
          {SOURCES.map(s => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">{s.title}</a>
              <span className="src">{s.src}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="foot">
        Guidance draws on published behavioural science and restaurant field trials, plus standard foodservice
        cost benchmarks &middot; offered as suggestions, not guarantees &middot; verify pricing quarterly with your distributor.
      </footer>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
