import type { Metadata } from "next";
import Link from "next/link";
import { MenuAnalyzer } from "./MenuAnalyzer";

/**
 * /getting-started — the restaurant-facing landing page for our menu service:
 * we take an existing menu and rework it so the plant-rich dishes are the ones
 * guests actually want to order. Copy is adapted from the Sell More Plants
 * behavioural-science playbook and pointed at Ahead of the Menu's own tools
 * (Recipes, Menus, Top Alternatives, Tips & Tricks).
 *
 * Static server component — no upload/analysis backend behind it. The CTA is a
 * real email hand-off, so nothing on this page promises a button that doesn't work.
 */

export const metadata: Metadata = {
  title: "Revamp",
  description:
    "Revamp reworks your restaurant menu so the plant-rich dishes are the ones guests want to order — better names, placement, defaults and pricing, backed by behavioural science.",
};

const MAILTO =
  "mailto:aheadofthemenu@gmail.com?subject=Revamp%20my%20menu&body=Hi%20Ahead%20of%20the%20Menu%2C%0A%0AI%27d%20like%20a%20Revamp%20of%20our%20menu.%0A%0AVenue%3A%0ACity%3A%0AMenu%20attached%3A%20(PDF%20or%20photo)%0AWhat%20we%27d%20most%20like%20to%20shift%3A%0A%0AThanks%21";

const STEPS = [
  {
    n: "01",
    title: "Upload your menu",
    body: "A PDF or a photo — whatever you have. We read every dish, course by course, exactly as a guest would.",
  },
  {
    n: "02",
    title: "We map the eight moves",
    body: "Your menu gets scored against eight evidence-backed moves, quoting your own dishes back to you. No generic advice.",
  },
  {
    n: "03",
    title: "You get a revamped menu",
    body: "Rewritten dish names, a new running order, and line-tested recipes from our library for any gaps worth filling.",
  },
];

const MOVES = [
  {
    n: 1,
    title: "Focus on tasty titles",
    body: "Name dishes for flavour, texture and provenance — the way you'd talk about a dish you're proud of. \u201cSmoky maple-glazed carrots\u201d beats \u201chealthy carrots.\u201d Words like vegan, meat-free and healthy quietly read as compromise and suppress orders.",
    stat: "Indulgent flavour names were chosen up to 41% more often; one curry renamed \u201cMild & Sweet Chickpea Curry\u201d sold 108% better.",
  },
  {
    n: 2,
    title: "Do NOT separate the menu",
    badge: "Biggest mistake",
    body: "A separate \u201cVegan / Veggie\u201d box tells meat-eaters this isn't for them. Plant-rich dishes belong beside comparable animal ones, inside each course, on equal footing. Keep your (V) markers — guests need them, and allergen info is often a legal requirement — just move them to the end of the line so the food leads, not the label.",
    stat: "Integrating plant dishes instead of a separate “vegetarian” section raised how often diners picked them by ~7 percentage points (Bacon & Krpan, 2018). Note: a menu-choice experiment, not till data.",
  },
  {
    n: 3,
    title: "Be proud and plant-based",
    body: (
      <>
        Train the floor to genuinely recommend the plant-rich dishes and highlight them via
        &ldquo;Our Favorite&rdquo; sections on your menu — but make sure your staff loves what
        they&rsquo;re serving, since guests can tell if it&rsquo;s not a real recommendation.{" "}
        <Link href="/dishes" className="font-medium text-apb-light underline underline-offset-4 hover:text-apb">
          Click here for inspiration
        </Link>
        , and if you still can&rsquo;t genuinely recommend anything on your menu yet,{" "}
        <a href={MAILTO} className="font-medium text-apb-light underline underline-offset-4 hover:text-apb">
          reach out to us for help
        </a>
        .
      </>
    ),
  },
  {
    n: 4,
    title: "Make meats add-ons",
    body: "Flip the framing. Not \u201cveggie burger (or add beef)\u201d but \u201cour signature mushroom-and-bean burger — make it beef +$2.\u201d The plant version becomes the dish; the animal version becomes the deliberate opt-in.",
    stat: "In a field trial, flipping the default took one dish from ~9% to 80% uptake, and another from 16% to 58%.",
  },
  {
    n: 5,
    title: "Price plant-based dishes fairly",
    body: "Don't try to charge more for plant-based dishes. An equivalent plant dish should cost the same or less than its animal counterpart — and oat milk shouldn't cost more than regular milk. A premium tells guests the plant option is a sacrifice, and it measurably discourages plant-based purchases.",
  },
  {
    n: 6,
    title: "Have lots of options",
    body: "More plant-based dishes on the menu means more get ordered — across starters, mains, sides, desserts and drinks, not just one.",
    stat: "Across 90,000+ meals, doubling the share of plant-based options raised plant sales 41\u201379% and cut meat sales ~15 percentage points.",
  },
  {
    n: 7,
    title: "Save money on the meat",
    body: "Shrink the meat share per plate and fold in plant-based proteins without losing the taste. Finely chopped mushrooms folded into patties at 25\u201330% keep the juiciness guests order for. Aquafaba for eggs, plant milks for dairy, and legumes for extra protein.",
    stat: "Mushroom-beef blends can read as more savoury than all-beef, not less.",
  },
  {
    n: 8,
    title: "Make plant-rich eating feel abundant",
    body: "Tie it together with generosity. Hero descriptions, tempting sides, a plant-forward special that changes with the season — the menu should make eating plants feel like a treat, not a box ticked.",
  },
  {
    n: 9,
    title: "The Extra Mile",
    badge: "Bonus move",
    badgeTone: "accent",
    body: "Once the first eight are working, go further. Reward plant-based orders through your loyalty program, build combo platters that lean plant-forward by default, or put the impact right on the menu next to the price — the water, carbon and animal lives a dish saves versus its meat-based counterpart.",
    stat: "e.g. \u201cSaves a life, 450 gallons of water, and 6kg of CO2 versus the beef version.\u201d Guests remember a number next to a price far longer than a paragraph.",
  },
];

/**
 * Kept in sync with LEVERS in public/tips-and-tricks/app.jsx — same eleven
 * reasons, same order, so a restaurant reading either page gets one story.
 * `examples` renders as pills; a JSX body may carry a link.
 */
const PAYOFFS: Array<{
  icon: string;
  title: string;
  body: React.ReactNode;
  examples?: string[];
}> = [
  {
    icon: "🥘",
    title: "Big profits on simple dishes",
    body: "Many traditional plant-based foods are cheap — sub-$1.50 food costs that stay fresh for days, are easy to make, and sell at a high margin.",
    examples: ["Dal makhani", "Mole poblano", "Mujadara", "Hummus"],
  },
  {
    icon: "🛡️",
    title: "Fewer health-code scares",
    body: "No raw meat means no salmonella, listeria or E. coli temperature-danger-zone violations from that station. Fewer contamination risks means fewer failed inspections, recalls and shutdown scares.",
  },
  {
    icon: "💰",
    title: "Lower cost per plate",
    body: "Legumes, grains, mushrooms and seasonal vegetables typically run 20–40% cheaper per portion than meat or fish, and they don't swing with commodity protein and dairy prices. Where meat stays, blending finely chopped mushrooms into patties and stews at 25–30% cuts your priciest ingredient while keeping — often improving — the flavour guests taste.",
  },
  {
    icon: "😊",
    title: "Cheaper food, happier customers",
    body: "Price the plant dish at or below its meat equivalent. Because it usually costs less to make, the volume it earns and the margin it carries compound in the same direction.",
  },
  {
    icon: "📈",
    title: "Growing demand",
    body: "27% of Gen Z and millennials want to eat plant-based foods, and the share keeps climbing. The menus that meet them are winning bookings their meat-only competitors are turning away.",
  },
  {
    icon: "🤝",
    title: "Everyone can eat it",
    body: "A plant dish is the lowest common denominator at a full table: no shellfish, fish, dairy or egg, and it works for vegans, vegetarians and pescetarians alike. One order nobody has to negotiate — and one dish that stops a group booking walking out the door.",
  },
  {
    icon: "🌾",
    title: "Resilience and sourcing",
    body: "A plant-forward menu is less exposed to meat and dairy supply shocks and price spikes, and far easier to source locally and seasonally — which makes for a fresher story on the plate too.",
  },
  {
    icon: "🎨",
    title: "More creativity",
    body: (
      <>
        Cooking with plants pushes a kitchen out of its comfort zone, and the range of plant-based
        products worth cooking with keeps widening.{" "}
        <Link
          href="/top-alternatives"
          className="font-medium text-apb-light underline underline-offset-4 hover:text-apb"
        >
          See which ones actually pass a blind taste test
        </Link>
        .
      </>
    ),
  },
  {
    icon: "📦",
    title: "Less spoilage, less waste",
    body: "Dry legumes and grains keep for months, not days. Anchoring low-turnover dishes on shelf-stable staples instead of fresh meat and dairy cuts write-offs and gives the kitchen more slack.",
  },
  {
    icon: "🎯",
    title: "Position for margin",
    body: "Guests order what's easiest to notice. Put the plant dish with the best margin where eyes land first — top of the section, boxed, chef's favorite — so the highest-margin dish is also the most-ordered one.",
  },
];

const SOURCES = [
  {
    href: "https://www.wri.org/insights/its-all-name-how-boost-sales-plant-based-menu-items",
    title: "It's All in a Name: How to Boost the Sales of Plant-Based Menu Items",
    src: "World Resources Institute — Better Buying Lab",
  },
  {
    href: "https://www.wri.org/insights/23-behavior-change-strategies-get-diners-eating-more-plant-rich-food",
    title: "23 Behaviour-Change Strategies to Get Diners Eating More Plant-Rich Food",
    src: "World Resources Institute",
  },
  {
    href: "https://www.pnas.org/doi/10.1073/pnas.1907207116",
    title: "Impact of increasing vegetarian availability on meal selection and sales in cafeterias",
    src: "Garnett et al., PNAS",
  },
  {
    href: "https://www.sciencedirect.com/science/article/pii/S0195666322001404",
    title: "A reversal of defaults: a menu-based default nudge for plant-based alternatives",
    src: "Appetite — default-framing field trial",
  },
  {
    href: "https://gfi.org/resource/promoting-plant-based-items-on-menus/",
    title: "How to promote plant-based items on menus",
    src: "Good Food Institute",
  },
  {
    href: "https://www.betterfoodfoundation.org/research-and-reports/research-plant-based-defaults-work/",
    title: "Why plant-based defaults work",
    src: "Better Food Foundation — DefaultVeg",
  },
];

export default function RevampPage() {
  return (
    <main className="bg-apb-cream text-[#0e1f14]">
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#163320] to-[#112619] text-apb-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(120% 90% at 85% 5%, rgba(45,122,62,0.38) 0%, transparent 55%), radial-gradient(90% 80% at 5% 100%, rgba(255,107,53,0.16) 0%, transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-5 py-20 md:px-8 md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-apb-accent/40 bg-apb-accent/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-apb-accent">
            For restaurants &amp; chefs
          </span>
          {/* The four-beat promise runs at roughly half the display size — at the
              hero's clamp() it would swamp the fold and wrap to four lines. */}
          <h1 className="mt-6 font-semibold tracking-tight">
            <span className="block text-[clamp(2.6rem,7vw,4.6rem)] leading-[1.02]">Upload your menu, make more money on plant foods.</span>
            <span className="mt-4 block max-w-3xl text-[clamp(1.3rem,3.1vw,2.1rem)] leading-[1.3] text-apb-accent">
              Make money. Sell more. Save lives. Help the planet.
            </span>
          </h1>
          <div className="mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <p className="text-lg leading-relaxed text-apb-cream/85 md:text-xl">
              Win-Win-Win for everyone.
            </p>
            <span aria-hidden className="hidden h-8 w-px bg-apb-cream/25 sm:block" />
            <p className="text-lg leading-relaxed text-apb-cream/85 md:text-xl">
              <b className="font-semibold text-apb-accent">27%</b> of Gen&nbsp;Z and millennials want
              to eat plant-based foods, and counting. Let&rsquo;s catch you up!
            </p>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#upload"
              className="inline-flex items-center gap-2 rounded-full bg-apb-accent px-6 py-3 text-base font-semibold text-[#112619] transition hover:bg-apb-accent-light"
            >
              Score my menu
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a
              href="#moves"
              className="inline-flex items-center rounded-full border border-apb-cream/25 px-6 py-3 text-base font-medium text-apb-cream/90 transition hover:border-apb-cream/50 hover:text-apb-cream"
            >
              See the eight moves
            </a>
          </div>
          <ul className="mt-12 grid gap-3 sm:grid-cols-3">
            {[
              ["+25–108%", "orders, from appetising dish names alone"],
              ["+41–79%", "plant sales when you double the options"],
              ["up to 8×", "uptake when plants become the default"],
            ].map(([stat, label]) => (
              <li key={stat} className="rounded-2xl border border-apb-cream/15 bg-white/[0.04] px-5 py-4">
                <div className="font-serif text-2xl font-semibold text-apb-accent">{stat}</div>
                <div className="mt-1 text-sm text-apb-cream/70">{label}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Upload + scorecard ---- */}
      <section id="upload" className="scroll-mt-20 border-b border-black/[0.06] bg-white/60">
        <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
          <div className="text-center">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-apb-light">Free menu check · no sign-up</div>
            <h2 className="mt-2 text-3xl font-semibold text-apb md:text-4xl">Score your menu in about a minute</h2>
          </div>
          <div className="mt-9">
            <MenuAnalyzer />
          </div>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20">
        <div className="text-center">
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-apb-light">How it works</div>
          <h2 className="mt-2 text-3xl font-semibold text-apb md:text-4xl">Three steps to a menu that sells plants</h2>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_1px_2px_rgba(14,31,20,0.04)]">
              <div className="font-serif text-sm font-semibold tracking-[0.2em] text-apb-accent">{s.n}</div>
              <h3 className="mt-3 text-xl font-semibold text-apb">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center text-[15px] text-neutral-600">
          Gaps worth filling get filled from our own library —{" "}
          <Link href="/recipes" className="font-medium text-apb-light underline underline-offset-4 hover:text-apb">
            line-tested recipes
          </Link>
          ,{" "}
          <Link href="/menus" className="font-medium text-apb-light underline underline-offset-4 hover:text-apb">
            full menus
          </Link>
          , and{" "}
          <Link href="/top-alternatives" className="font-medium text-apb-light underline underline-offset-4 hover:text-apb">
            blind-taste-tested swaps
          </Link>{" "}
          for the dairy and meat you&rsquo;re replacing.
        </p>
      </section>

      {/* ---- The eight moves ---- */}
      <section id="moves" className="scroll-mt-20 border-y border-black/[0.06] bg-white/60">
        <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20">
          <div className="max-w-2xl">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-apb-light">The playbook</div>
            {/* The demand case, stated once and large, right before the how-to. */}
            <p className="mt-3 max-w-3xl font-serif text-[clamp(1.5rem,3.4vw,2.4rem)] font-semibold leading-[1.25] text-apb">
              <span className="text-apb-accent">27%</span> of Gen&nbsp;Z and millennials want to eat
              plant-based foods, and counting. Let&rsquo;s catch you up!
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              GlobeScan{" "}
              <a
                href="https://globescan.com/2024/06/05/insight-of-the-week-plant-based-consumption-across-generations/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-apb"
              >
                Grains of Truth
              </a>{" "}
              — 29,565 people across 31 markets. Boomers: 16%.
            </p>
            <h2 className="mt-8 text-3xl font-semibold text-apb md:text-4xl">Eight moves to improve your menu</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {MOVES.map((m) => {
              const badgeCls =
                m.badgeTone === "accent"
                  ? "border-apb-light/40 bg-apb-cream text-apb"
                  : "border-red-200 bg-red-50 text-red-600";
              return (
              <article
                key={m.n}
                className={`rounded-2xl border bg-white p-6 ${m.badge ? (m.badgeTone === "accent" ? "border-apb-light/40" : "border-red-200") : "border-black/[0.07]"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-apb-accent">
                    Move {m.n}
                  </div>
                  {m.badge && (
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${badgeCls}`}>
                      {m.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-xl font-semibold text-apb">{m.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{m.body}</p>
                {m.stat && (
                  <p className="mt-4 rounded-xl border-l-[3px] border-apb-light bg-apb-cream px-4 py-3 text-[14px] leading-relaxed text-apb">
                    {m.stat}
                  </p>
                )}
              </article>
              );
            })}
          </div>
          <p className="mt-8 text-[15px] text-neutral-600">
            Want the kitchen-side version of these?{" "}
            <Link href="/tips-and-tricks" className="font-medium text-apb-light underline underline-offset-4 hover:text-apb">
              Tips &amp; Tricks
            </Link>{" "}
            covers the swaps and techniques behind moves 5 and 7.
          </p>
        </div>
      </section>

      {/* ---- Why it pays ---- */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold text-apb md:text-4xl">
            Good for the planet, also good for your wallet
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PAYOFFS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-black/[0.07] bg-white p-6">
              <span className="text-2xl" aria-hidden>{p.icon}</span>
              <h3 className="mt-3 text-lg font-semibold text-apb">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{p.body}</p>
              {p.examples && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {p.examples.map((e) => (
                    <li key={e} className="rounded-full bg-apb-cream px-2.5 py-1 text-[11px] text-apb">
                      {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---- Reassurance ---- */}
      <section className="border-y border-black/[0.06] bg-white/60">
        <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-apb-light">Peace of mind</div>
          <h2 className="mt-2 text-3xl font-semibold text-apb">You keep every dish. Guests keep every choice.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-neutral-600">
            Nothing here asks you to take steak off the menu or turn away meat lovers. A Revamp gives
            your plant-rich dishes a fair shot at being chosen — through better names, placement,
            defaults and pricing. Guests still order exactly what they want. More of them just find
            themselves wanting the plants.
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-neutral-600">
            That&rsquo;s the whole idea behind Ahead of the Menu: food where everyone eats.
          </p>
        </div>
      </section>

      {/* ---- Sources ---- */}
      <section className="mx-auto max-w-3xl px-5 py-16 md:px-8">
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-apb-light">Go deeper</div>
        <h2 className="mt-2 text-3xl font-semibold text-apb">The research behind the moves</h2>
        <ul className="mt-6 space-y-4">
          {SOURCES.map((s) => (
            <li key={s.href} className="border-l-2 border-apb-light/40 pl-4">
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-apb underline underline-offset-4 hover:text-apb-light"
              >
                {s.title}
              </a>
              <div className="mt-0.5 text-sm text-neutral-500">{s.src}</div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm italic text-neutral-500">
          Figures are summarised for a general audience and offered as guidance, not guarantees —
          follow the links for exact numbers and methods.
        </p>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="bg-gradient-to-b from-[#163320] to-[#112619] text-apb-cream">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center md:px-8 md:py-20">
          <h2 className="text-3xl font-semibold md:text-4xl">Ready to revamp?</h2>
          <p className="mt-3 text-lg text-apb-cream/80">
            Upload your current menu and get the eight moves marked up on your own dishes — plus
            recipes for anything worth adding.
          </p>
          <a
            href="#upload"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-apb-accent px-7 py-3.5 text-base font-semibold text-[#112619] transition hover:bg-apb-accent-light"
          >
            Score my menu
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <p className="mt-4 text-sm text-apb-cream/60">
            Free, no sign-up. Browse{" "}
            <Link href="/dishes" className="underline underline-offset-4 hover:text-apb-cream">
              the dish library
            </Link>{" "}
            too. Want us to walk the menu with you instead?{" "}
            <a href={MAILTO} className="underline underline-offset-4 hover:text-apb-cream">
              Email us
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
