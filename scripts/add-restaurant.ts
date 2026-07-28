/**
 * Add manually-curated reverse-lookup venues (from scripts/data/manual-restaurants.json)
 * that are NOT part of the fully-vegan SVG guide — e.g. vegetarian spots with vegan
 * options, which carry verified=false (no "Fully vegan" badge).
 *
 * Usage:
 *   bun scripts/add-restaurant.ts            # dry-run: prints the plan, no network
 *   bun scripts/add-restaurant.ts --execute  # idempotent insert into the dishes DB
 *
 * Idempotency: each venue is matched by (city, lower(name)) before insert; re-runs are no-ops.
 */

export {}; // make this a module (enables top-level await)

type VenueLocation = { address: string; neighborhood: string | null; phone: string | null };
type ManualRestaurant = {
  name: string;
  city: string;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  description: string | null;
  cuisines: string[];
  verified: boolean;
  locations: VenueLocation[];
};

const DATA_PATH = "scripts/data/manual-restaurants.json";

async function load(): Promise<ManualRestaurant[]> {
  const json = JSON.parse(await Bun.file(DATA_PATH).text());
  return (json.restaurants ?? []) as ManualRestaurant[];
}

const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

async function gql<T>(url: string, secret: string, query: string, variables?: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-hasura-admin-secret": secret },
    body: JSON.stringify({ query, variables }),
  });
  return res.json() as Promise<{ data?: T; errors?: Array<{ message: string }> }>;
}

async function execute(rows: ManualRestaurant[]) {
  const subdomain = process.env.NHOST_SUBDOMAIN;
  const region = process.env.NHOST_REGION;
  const secret = process.env.NHOST_GRAPHQL_SECRET;
  if (!subdomain || !region || !secret) {
    console.error("ERROR: NHOST_SUBDOMAIN, NHOST_REGION, NHOST_GRAPHQL_SECRET required for --execute.");
    process.exit(1);
  }
  const url = `https://${subdomain}.hasura.${region}.nhost.run/v1/graphql`;
  console.log(`GraphQL endpoint: ${url}\n`);

  let created = 0, existed = 0;
  for (const r of rows) {
    const found = await gql<{ restaurants: Array<{ id: string }> }>(
      url, secret,
      `query ($city: String!, $name: String!) { restaurants(where: { city: { _eq: $city }, name: { _ilike: $name } }, limit: 1) { id } }`,
      { city: r.city, name: likeEscape(r.name) }
    );
    if (found.errors?.length) throw new Error(`lookup failed for ${r.name}: ${found.errors[0].message}`);
    if (found.data?.restaurants?.length) { existed++; console.log(`  = exists: ${r.name}`); continue; }

    const res = await gql<{ insert_restaurants_one: { id: string } }>(
      url, secret,
      `mutation ($obj: restaurants_insert_input!) { insert_restaurants_one(object: $obj) { id } }`,
      {
        obj: {
          city: r.city, name: r.name, website: r.website, instagram: r.instagram, facebook: r.facebook,
          description: r.description, cuisines: r.cuisines, verified: r.verified,
          locations: r.locations.length ? { data: r.locations } : undefined,
        },
      }
    );
    if (res.errors?.length) throw new Error(`insert failed for ${r.name}: ${res.errors[0].message}`);
    created++; console.log(`  + created: ${r.name} (${res.data?.insert_restaurants_one?.id})`);
  }
  console.log(`\nDone. created=${created} existed=${existed} total=${rows.length}`);
}

const rows = await load();
if (process.argv.includes("--execute")) {
  console.log("ADD-RESTAURANT — EXECUTE MODE (writing to DB)\n");
  await execute(rows);
} else {
  console.log("ADD-RESTAURANT — DRY RUN (no writes)\n");
  for (const r of rows) {
    console.log(`  ${r.name}  [verified=${r.verified}]`);
    console.log(`    city=${r.city} · cuisines=${r.cuisines.join(", ")}`);
    for (const l of r.locations) console.log(`    📍 ${l.address}${l.neighborhood ? ` · ${l.neighborhood}` : ""}${l.phone ? ` · ${l.phone}` : ""}`);
  }
  console.log(`\n${rows.length} venue(s). Run with --execute to insert (idempotent).`);
}
