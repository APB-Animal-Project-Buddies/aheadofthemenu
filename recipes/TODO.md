# Recipes — follow-up work

## Pricing data
- [ ] **Backup pricing estimates** — for the 15 recipes whose `menuPrice` doesn't parse cleanly, derive a best-effort midpoint from cuisine + course + cost (e.g. cost ÷ 0.30 for a casual main). Today they show no value tier on the card.
- [ ] **Regional menu-price points** — store low/mid/high menu prices per market (US Tier 1 / Tier 2 / Europe / etc.) and let the chef pick a region in the UI. Today the catalog assumes 2025–26 US foodservice, which over-prices for non-US operators and under-prices for NYC/SF.
- [ ] **Quarterly pricing refresh** — schedule the URL liveness checker AND a re-pull of foodservice pricing so the value-tier badges stay accurate as Beyond/Impossible drop wholesale floors.
- [ ] **Authoritative source on regional prices of goods** — wire in (or build) a kept-up-to-date feed of wholesale ingredient and faux-meat prices by region, so the catalog's $X/lb numbers don't go stale. Candidates: USDA AMS reports, Webstaurant Store API, Sysco Connect, Restaurant Depot index, or a partnership with a foodservice analytics firm.
- [ ] **Authoritative source on regional menu pricing** — pair the cost feed with similarly-priced dish benchmarks across markets (NYC vs Chicago vs Seattle vs LA vs London vs Mumbai). Lets the value-tier badge adjust to local context — a $14 hummus in Manhattan and a $9 hummus in Cleveland are both market-correct.

## Recipe data quality
- [ ] **Hand-review the 30 description fallbacks** — `description_overrides.json` covers them today; tighten language with a chef-editor pass.
- [ ] **Real photography** — the placeholder gradient blobs do their job, but real product photos (or at least illustrative AI-generated ones, see `scripts/generate-recipe-images.ts` WIP) would lift the cards substantially.
- [ ] **More cuisines** — catalog is 17 cuisines / 135 dishes. Logical adds: Filipino, Peruvian, Lebanese (split from Middle Eastern), West African.
- [ ] **Reviews from friends + chefs** — invite the APB network and trusted chefs to leave a star + comment per recipe ("worked in service / 30-min prep is honest / sub jackfruit was better"). Store keyed by recipe id; display top 1–3 on the modal.
- [ ] **Base-ingredient prep guides** — each recipe references protein components (Juicy Marbles Loin, Chunk Steakhouse Cut, seitan, jackfruit, soy curls, hearts of palm, etc.). Build a `/ingredients/<slug>` companion library: best-way-to-cook, hold/freeze behaviour, common failure modes, recommended cuts/treatments. Link from recipe modals where the ingredient appears.
- [ ] **Logistical / shelf-life metadata** per branded product and pantry staple — frozen vs refrigerated shelf life, opened vs sealed, par-stock recommendations, distributor lead times, case sizes. This belongs alongside the ingredient prep guides so a chef opening "Juicy Marbles Loin" sees "frozen 18 mo, thawed 7 days, 4 oz × 20/case, ~7-day Sysco lead time" without leaving the page.

## AI-assisted menu building
- [ ] **Auto-generate a menu from a description** — chef types "Spring tasting menu, 6 courses, $45 ticket, French-Italian, no nuts" → AI picks 6 dishes from the 135-recipe catalog that fit the cuisines, sum to the food-cost target, and respect allergens. Surface it as a "✨ Build me a menu" button next to "Your menu" pill. Uses the catalog as grounded context so it can't hallucinate dishes.

## UX
- [ ] **"Send to kitchen" → real workflow** — today it opens a `mailto:`. Replace with an APB-hosted POST endpoint that captures the menu, sends a styled PDF/email, and stores chef contact info for follow-up.
- [ ] **Export PDF** — currently `window.print()` with default print stylesheet. Build a proper print template (logo, dish photos, ingredient pull-list, prep timeline).
- [ ] **Search box ranking** — pure substring match today. Could add fuzzy/typo tolerance (Fuse.js) so "boergignon" still finds "Bourguignon".
- [ ] **Per-dish reviews / chef notes** — let logged-in chefs leave private notes on dishes they've service-tested (works in their kitchen / doesn't / what they tweaked).
- [ ] **Adaptive recipe counts under filters** — cuisine-chip and course-chip counts are static today (e.g. `Italian 8` always shows 8). When other filters narrow the result set, the chip counts should reflect the *intersection* — `Italian 3` if only 3 Italian dishes survive the active sourcing + tag + search filters. Helps chefs see which combinations have stock.
- [ ] **Make active filters more obvious** — today the only signals are the dark "on" chip and the toolbar count. Add an explicit "filters: course=main · sourcing=in-house · 🥘 bulk-prep × Clear all" summary bar above the grid so it's clear what's narrowing the results, with a one-tap reset.

## Top Alternatives (Nectar)
- [ ] **Cycle in eggs / meat / seafood** when Nectar publishes — `_dairy.json` schema is already keyed by category, easy to expand.
- [ ] **Sourcing links per pick** — wholesale distributor + retail link per brand, plus minimum order quantity.

## Tips & Tricks
- [ ] **Author voice pass** — `Foodservice sourcing summary` and `Menu-engineering tips` are still verbose; run them through the same simplification treatment as `Operational deployment by archetype`.

## Mobile
- [ ] **Full mobile pass** — every page (Recipes, Top Alternatives, Tips & Tricks) needs a careful 375px / 390px / 430px walkthrough. Known suspects: Kinder World Guide brand stack vs nav links (likely needs hamburger), the menu pill (currently absolute-right), the recipe modal (image-on-top + scrollable body), the menu drawer (full-screen on mobile), the sub-section grid in tips, and the dairy leaderboard. Plus tap targets, font sizes, and safe-area insets.

## Infra
- [ ] **Lift the Babel-standalone tax** — every page compiles JSX in the browser (~200ms FOUC). Move to a real bundler when the page count grows or perf regresses.
- [ ] **Health check** — extend the `/api/keep-alive` ping to also hit `/recipes`, `/top-dairy-products`, `/tips-and-tricks` so the static pages get warmed.
