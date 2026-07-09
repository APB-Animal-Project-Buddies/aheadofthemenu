/**
 * Seed script: reverse-lookup catalog (restaurants + dishes)
 *
 * Usage: bun scripts/seed-reverse-lookup.ts            # dry-run: local parse + printed plan, no network
 *        bun scripts/seed-reverse-lookup.ts --execute  # writes to the DB (post-migration, user-gated)
 *
 * Dry-run is the default and is PURELY LOCAL — no env vars read, no network
 * connection opened. Only --execute reads env and talks GraphQL.
 *
 * Data sources:
 *   scripts/data/svg-guide-2026-06-29.csv   → verified restaurant + location rows
 *   scripts/data/seattle-dishes.json        → community dish catalog
 *
 * Idempotency (--execute only):
 *   Restaurants: checked by (city, lower(name)) before insert.
 *   Dishes:      checked by (restaurant_id, lower(name)) before insert.
 *   Re-running is a no-op; prints `created` vs `existed` counts.
 */

import { parseSvgCsv } from "../lib/reverse-lookup";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SeedLocation = { address: string; neighborhood: string | null; phone: string | null };
type SeedRestaurant = {
  name: string;
  city: string;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  description: string | null;
  cuisines: string[];
  lastVerified: string | null;
  verified: boolean;
  locations: SeedLocation[];
};

type JsonDishRestaurant = {
  name: string;
  city: string;
  url: string | null;
  address: string | null;
  notes: string | null;
};

type JsonDish = {
  id: string;
  name: string;
  description: string | null;
  ingredients?: string[];
  tags?: string[];
  flavors?: string[];
  allergens?: Array<{ name: string; optional?: boolean }>;
  locallyMade?: boolean;
  restaurants: JsonDishRestaurant[];
};

type DishPlan = {
  dishName: string;
  dishId: string;
  tags: string[];
  details: Record<string, unknown>;
  restaurantName: string;
  restaurantCity: string;
  restaurantIsNew: boolean;
};

type GraphQLResponse<T = unknown> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

// ---------------------------------------------------------------------------
// Data loading (purely local — reads files, no network)
// ---------------------------------------------------------------------------

async function loadCsvRestaurants(): Promise<SeedRestaurant[]> {
  const text = await Bun.file("scripts/data/svg-guide-2026-06-29.csv").text();
  const parsed = parseSvgCsv(text);
  return parsed.map((r) => ({
    name: r.name,
    city: "seattle",
    website: r.website,
    instagram: r.instagram,
    facebook: r.facebook,
    description: r.description,
    cuisines: r.cuisines,
    lastVerified: r.lastVerified,
    verified: true,
    locations: r.locations,
  }));
}

async function loadDishes(): Promise<JsonDish[]> {
  const text = await Bun.file("scripts/data/seattle-dishes.json").text();
  const json = JSON.parse(text);
  return json.dishes as JsonDish[];
}

// ---------------------------------------------------------------------------
// Plan builder (no network)
// ---------------------------------------------------------------------------

type Plan = {
  /** Restaurants from the CSV — always inserted/verified */
  csvRestaurants: SeedRestaurant[];
  /** Net-new restaurants discovered from the dishes JSON (not in CSV) */
  newRestaurants: SeedRestaurant[];
  /** All dish insert plans */
  dishes: DishPlan[];
};

function buildPlan(csvRestaurants: SeedRestaurant[], dishes: JsonDish[]): Plan {
  // Build a lookup set of lower-cased restaurant names from CSV
  const csvNameSet = new Map<string, SeedRestaurant>();
  for (const r of csvRestaurants) {
    csvNameSet.set(r.name.toLowerCase(), r);
  }

  const newRestaurants: SeedRestaurant[] = [];
  const newRestaurantNameSet = new Map<string, SeedRestaurant>();

  const dishPlans: DishPlan[] = [];

  for (const dish of dishes) {
    for (const jr of dish.restaurants) {
      const key = jr.name.toLowerCase();
      const inCsv = csvNameSet.has(key);
      const alreadyPlanned = newRestaurantNameSet.has(key);

      let isNew = false;
      if (!inCsv && !alreadyPlanned) {
        // Create a new restaurant plan from the dish JSON data.
        // `city` is the CATALOG bucket, not the venue's town: the catalog
        // queries city='seattle' for the whole metro (the CSV files Bellevue,
        // Kirkland, Everett... the same way). The venue's actual town goes in
        // the location's neighborhood, like the CSV's "Eastside".
        const newRestaurant: SeedRestaurant = {
          name: jr.name,
          city: "seattle",
          website: jr.url ?? null,
          instagram: null,
          facebook: null,
          description: null,
          cuisines: [],
          lastVerified: null,
          verified: true,
          locations: jr.address
            ? [{ address: jr.address, neighborhood: jr.city || null, phone: null }]
            : [],
        };
        newRestaurants.push(newRestaurant);
        newRestaurantNameSet.set(key, newRestaurant);
        isNew = true;
      }

      // Build details: only include defined keys
      const details: Record<string, unknown> = {};
      if (dish.ingredients !== undefined) details.ingredients = dish.ingredients;
      if (dish.allergens !== undefined) details.allergens = dish.allergens;
      if (dish.flavors !== undefined) details.flavors = dish.flavors;
      if (dish.locallyMade !== undefined) details.locallyMade = dish.locallyMade;

      dishPlans.push({
        dishName: dish.name,
        dishId: dish.id,
        tags: dish.tags ?? [],
        details,
        restaurantName: jr.name,
        restaurantCity: "seattle",
        restaurantIsNew: isNew,
      });
    }
  }

  return { csvRestaurants, newRestaurants, dishes: dishPlans };
}

// ---------------------------------------------------------------------------
// Dry-run output (no network)
// ---------------------------------------------------------------------------

function printDryRunPlan(plan: Plan): void {
  const allRestaurants = [...plan.csvRestaurants, ...plan.newRestaurants];

  console.log("=".repeat(70));
  console.log("REVERSE-LOOKUP SEED — DRY-RUN PLAN (no network, no DB writes)");
  console.log("=".repeat(70));
  console.log();

  console.log(`RESTAURANTS (${allRestaurants.length} total)`);
  console.log(`  ${plan.csvRestaurants.length} from SVG Guide CSV (verified)`);
  console.log(`  ${plan.newRestaurants.length} from seattle-dishes.json only (new)`);
  console.log();

  // Group location counts
  console.log("─".repeat(70));
  console.log(" # | Source       | Locations | Name");
  console.log("─".repeat(70));
  let i = 1;
  for (const r of plan.csvRestaurants) {
    const loc = r.locations.length;
    console.log(
      `${String(i).padStart(2)} | CSV          |     ${loc}     | ${r.name}${
        r.cuisines.length ? ` (${r.cuisines.join(", ")})` : ""
      }`
    );
    i++;
  }
  for (const r of plan.newRestaurants) {
    const loc = r.locations.length;
    console.log(
      `${String(i).padStart(2)} | dishes.json  |     ${loc}     | ${r.name} [city: ${r.city}]`
    );
    i++;
  }
  console.log();

  console.log(`DISHES (${plan.dishes.length} total)`);
  console.log("─".repeat(70));
  for (const d of plan.dishes) {
    const detailKeys = Object.keys(d.details);
    console.log(`  • ${d.dishName}`);
    console.log(
      `      → restaurant: ${d.restaurantName}${d.restaurantIsNew ? " [NEW]" : " [CSV]"}`
    );
    console.log(`      → tags: [${d.tags.join(", ")}]`);
    if (detailKeys.length) {
      console.log(`      → details keys: {${detailKeys.join(", ")}}`);
    }
  }
  console.log();

  console.log("─".repeat(70));
  console.log(
    `Summary: ${allRestaurants.length} restaurants (${plan.csvRestaurants.length} CSV + ${plan.newRestaurants.length} new), ${plan.dishes.length} dishes`
  );
  console.log();
  console.log(
    "To write to the DB (post-migration): bun scripts/seed-reverse-lookup.ts --execute"
  );
  console.log("=".repeat(70));
}

// ---------------------------------------------------------------------------
// Execute mode: GraphQL helpers (only called when --execute is passed)
// ---------------------------------------------------------------------------

function buildGraphqlUrl(subdomain: string, region: string): string {
  return `https://${subdomain}.hasura.${region}.nhost.run/v1/graphql`;
}

async function gql<T = unknown>(
  url: string,
  adminSecret: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<GraphQLResponse<T>> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": adminSecret,
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json() as Promise<GraphQLResponse<T>>;
}

// Escape LIKE wildcards so _ilike is an exact case-insensitive match.
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

async function findRestaurantId(
  url: string,
  secret: string,
  city: string,
  name: string
): Promise<string | null> {
  const res = await gql<{ restaurants: Array<{ id: string }> }>(
    url,
    secret,
    `query ($city: String!, $name: String!) {
       restaurants(where: { city: { _eq: $city }, name: { _ilike: $name } }, limit: 1) { id }
     }`,
    { city, name: likeEscape(name) }
  );
  return res.data?.restaurants?.[0]?.id ?? null;
}

async function insertRestaurant(
  url: string,
  secret: string,
  r: SeedRestaurant
): Promise<{ id: string; existed: boolean }> {
  // Check first
  const existing = await findRestaurantId(url, secret, r.city, r.name);
  if (existing) return { id: existing, existed: true };

  const res = await gql<{ insert_restaurants_one: { id: string } | null }>(
    url,
    secret,
    `mutation ($obj: restaurants_insert_input!) {
       insert_restaurants_one(object: $obj) { id }
     }`,
    {
      obj: {
        city: r.city,
        name: r.name,
        website: r.website,
        instagram: r.instagram,
        facebook: r.facebook,
        description: r.description,
        cuisines: r.cuisines,
        verified: r.verified,
        last_verified: r.lastVerified,
        locations: r.locations.length
          ? {
              data: r.locations.map((l) => ({
                address: l.address,
                neighborhood: l.neighborhood,
                phone: l.phone,
              })),
            }
          : undefined,
      },
    }
  );
  if (res.errors?.length) {
    // Race condition / duplicate — try to find it
    if (/unique|duplicate/i.test(res.errors[0].message)) {
      const found = await findRestaurantId(url, secret, r.city, r.name);
      if (found) return { id: found, existed: true };
    }
    throw new Error(`Insert restaurant failed: ${res.errors[0].message}`);
  }
  const id = res.data?.insert_restaurants_one?.id;
  if (!id) throw new Error(`Insert restaurant returned no id for: ${r.name}`);
  return { id, existed: false };
}

async function findDishId(
  url: string,
  secret: string,
  restaurantId: string,
  name: string
): Promise<string | null> {
  const res = await gql<{ restaurant_dishes: Array<{ id: string }> }>(
    url,
    secret,
    `query ($rid: uuid!, $name: String!) {
       restaurant_dishes(where: { restaurant_id: { _eq: $rid }, name: { _ilike: $name } }, limit: 1) { id }
     }`,
    { rid: restaurantId, name: likeEscape(name) }
  );
  return res.data?.restaurant_dishes?.[0]?.id ?? null;
}

async function insertDish(
  url: string,
  secret: string,
  restaurantId: string,
  d: DishPlan
): Promise<{ id: string; existed: boolean }> {
  // Check first
  const existing = await findDishId(url, secret, restaurantId, d.dishName);
  if (existing) return { id: existing, existed: true };

  const res = await gql<{ insert_restaurant_dishes_one: { id: string } | null }>(
    url,
    secret,
    `mutation ($obj: restaurant_dishes_insert_input!) {
       insert_restaurant_dishes_one(object: $obj) { id }
     }`,
    {
      obj: {
        restaurant_id: restaurantId,
        name: d.dishName,
        tags: d.tags,
        details: d.details,
        status: "live",
      },
    }
  );
  if (res.errors?.length) {
    if (/unique|duplicate/i.test(res.errors[0].message)) {
      const found = await findDishId(url, secret, restaurantId, d.dishName);
      if (found) return { id: found, existed: true };
    }
    throw new Error(`Insert dish failed: ${res.errors[0].message}`);
  }
  const id = res.data?.insert_restaurant_dishes_one?.id;
  if (!id) throw new Error(`Insert dish returned no id for: ${d.dishName}`);
  return { id, existed: false };
}

// ---------------------------------------------------------------------------
// Execute mode runner
// ---------------------------------------------------------------------------

async function runExecute(plan: Plan, restaurantsOnly = false): Promise<void> {
  const subdomain = process.env.NHOST_SUBDOMAIN;
  const region = process.env.NHOST_REGION;
  const secret = process.env.NHOST_GRAPHQL_SECRET;

  if (!subdomain || !region || !secret) {
    const missing = [
      !subdomain && "NHOST_SUBDOMAIN",
      !region && "NHOST_REGION",
      !secret && "NHOST_GRAPHQL_SECRET",
    ]
      .filter(Boolean)
      .join(", ");
    console.error(`ERROR: Missing required env vars: ${missing}`);
    console.error(
      "These are required for --execute mode. Set them in .env or .env.local."
    );
    process.exit(1);
  }

  const url = buildGraphqlUrl(subdomain, region);
  console.log(`GraphQL endpoint: ${url}`);
  console.log();

  // Track counts
  let restaurantsCreated = 0;
  let restaurantsExisted = 0;
  let dishesCreated = 0;
  let dishesExisted = 0;

  // Build a name → id map for all restaurants (populated as we go)
  const restaurantIdByLowerName = new Map<string, string>();

  // 1. Insert CSV restaurants
  console.log(`Seeding ${plan.csvRestaurants.length} CSV restaurants…`);
  for (const r of plan.csvRestaurants) {
    const result = await insertRestaurant(url, secret, r);
    restaurantIdByLowerName.set(r.name.toLowerCase(), result.id);
    if (result.existed) {
      restaurantsExisted++;
      console.log(`  existed: ${r.name}`);
    } else {
      restaurantsCreated++;
      console.log(`  created: ${r.name} (${result.id})`);
    }
  }

  // --restaurants-only: seed just the verified CSV venues; skip dish-discovered
  // restaurants and dishes (dishes come from the community).
  if (restaurantsOnly) {
    console.log();
    console.log("=".repeat(70));
    console.log("SEED COMPLETE (restaurants-only)");
    console.log(`  Restaurants: ${restaurantsCreated} created, ${restaurantsExisted} already existed`);
    console.log("=".repeat(70));
    return;
  }

  // 2. Insert net-new restaurants from dishes.json
  if (plan.newRestaurants.length) {
    console.log();
    console.log(`Seeding ${plan.newRestaurants.length} new restaurants from dishes.json…`);
    for (const r of plan.newRestaurants) {
      const result = await insertRestaurant(url, secret, r);
      restaurantIdByLowerName.set(r.name.toLowerCase(), result.id);
      if (result.existed) {
        restaurantsExisted++;
        console.log(`  existed: ${r.name}`);
      } else {
        restaurantsCreated++;
        console.log(`  created: ${r.name} (${result.id})`);
      }
    }
  }

  // 3. Insert dishes
  console.log();
  console.log(`Seeding ${plan.dishes.length} dishes…`);
  for (const d of plan.dishes) {
    const restaurantId = restaurantIdByLowerName.get(d.restaurantName.toLowerCase());
    if (!restaurantId) {
      console.error(
        `  ERROR: No restaurant id resolved for "${d.restaurantName}" — skipping dish "${d.dishName}"`
      );
      continue;
    }
    const result = await insertDish(url, secret, restaurantId, d);
    if (result.existed) {
      dishesExisted++;
      console.log(`  existed: ${d.dishName} @ ${d.restaurantName}`);
    } else {
      dishesCreated++;
      console.log(`  created: ${d.dishName} @ ${d.restaurantName} (${result.id})`);
    }
  }

  // 4. Summary
  console.log();
  console.log("=".repeat(70));
  console.log("SEED COMPLETE");
  console.log(
    `  Restaurants: ${restaurantsCreated} created, ${restaurantsExisted} already existed`
  );
  console.log(`  Dishes:      ${dishesCreated} created, ${dishesExisted} already existed`);
  console.log("=".repeat(70));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const executeMode = args.includes("--execute");
const restaurantsOnly = args.includes("--restaurants-only");

if (executeMode) {
  console.log("=".repeat(70));
  console.log(`REVERSE-LOOKUP SEED — EXECUTE MODE (writing to DB)${restaurantsOnly ? " — restaurants only" : ""}`);
  console.log("=".repeat(70));
  console.log();
  const csvRestaurants = await loadCsvRestaurants();
  const dishes = await loadDishes();
  const plan = buildPlan(csvRestaurants, dishes);
  await runExecute(plan, restaurantsOnly);
} else {
  // Default: dry-run — purely local, no env reads, no network
  const csvRestaurants = await loadCsvRestaurants();
  const dishes = await loadDishes();
  const plan = buildPlan(csvRestaurants, dishes);
  printDryRunPlan(plan);
}
