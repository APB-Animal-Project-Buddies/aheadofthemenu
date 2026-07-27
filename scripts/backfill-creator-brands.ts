/**
 * Split brand-named creators into brand + person.
 *
 *   bun scripts/backfill-creator-brands.ts             # dry run — read-only
 *   bun scripts/backfill-creator-brands.ts --execute   # applies the mapping
 *
 * ⚠️  PRODUCTION database, and these are REAL PEOPLE'S NAMES. Read the dry run
 * and check the pairings before executing. A wrong name here is a public
 * misattribution, not a cosmetic bug.
 *
 * Context: creators.display_name holds the person and creators.creator_name
 * holds the brand, but most rows were created from a free-text attribution, so
 * display_name ended up holding the BRAND and creator_name is null. The gallery
 * now shows brand first with the person in parentheses underneath, so those
 * rows render with no person at all.
 *
 * This moves the brand into creator_name and puts the person in display_name.
 *
 * Only pairings that are widely and publicly published are listed. Anything
 * uncertain is deliberately absent — see UNRESOLVED at the bottom — and
 * organisations are excluded outright, because they have no "person behind it".
 */
import { graphql } from "../lib/nhost";

const EXECUTE = process.argv.slice(2).includes("--execute");

/** slug → the person behind the brand. The current display_name becomes the brand. */
const PERSON_BY_SLUG: Record<string, string> = {
  "rainbow-plant-life": "Nisha Vora",
  "vegan-richa": "Richa Hingle",
  "minimalist-baker": "Dana Shultz",
  "pick-up-limes": "Sadia Badiei",
  "school-night-vegan": "Richard Makin",
  "ela-vegan": "Michaela Vais",
  "it-doesn-t-taste-like-chicken": "Sam Turnbull",
  "nora-cooks": "Nora Taylor",
  "loving-it-vegan": "Alison Andrews",
  "cookie-and-kate": "Kathryne Taylor",
  "hot-thai-kitchen": "Pailin Chongchitnant",
  "just-one-cookbook": "Namiko Chen",
  "recipetin-eats": "Nagi Maehashi",
  "budget-bytes": "Beth Moncel",
  "love-and-lemons": "Jeanine Donofrio",
  "holy-cow-vegan": "Vaishali Honawar",
  "connoisseurus-veg": "Alissa Saenz",
  "rabbit-and-wolves": "Lauren Hartmann",
  "dora-s-table": "Dora Stone",
  "piping-pot-curry": "Meeta Arora",
  "cook-with-manali": "Manali Singh",
  "pickled-plum": "Caroline Phelps",
  "okonomi-kitchen": "Lisa Kitahara",
  "omnivore-s-cookbook": "Maggie Zhu",
  "healthier-steps": "Michelle Blackwood",
  "plantbased-on-a-budget": "Toni Okamoto",
  "gretchen-s-vegan-bakery": "Gretchen Price",
};

/**
 * Brands with no single person behind them. These MUST keep a brand-only card —
 * inventing a person for them would be wrong, not merely incomplete.
 */
const ORGANISATIONS = new Set([
  "juicy-marbles", // Slovenian food-tech company
  "nyt-cooking", // publication
  "fooby", // Swiss retail brand
  "daikon-vegan-sushi-group", // group
  "cinnamon-snail-viet-vegan", // combined restaurant attribution
]);

type Row = { id: string; slug: string | null; display_name: string; creator_name: string | null };

async function main() {
  console.log(EXECUTE ? "MODE: EXECUTE (will write)" : "MODE: dry run (read-only)");
  console.log("⚠️  These are real people's names — verify before executing.\n");

  const res = await graphql<{ creators: Row[] }>(
    `query { creators { id slug display_name creator_name } }`,
    { useAdminSecret: true }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);
  const rows = res.data?.creators ?? [];
  const bySlug = new Map(rows.filter((r) => r.slug).map((r) => [r.slug as string, r]));

  const planned: Array<{ row: Row; brand: string; person: string }> = [];
  const skipped: string[] = [];

  for (const [slug, person] of Object.entries(PERSON_BY_SLUG)) {
    const row = bySlug.get(slug);
    if (!row) {
      skipped.push(`${slug} — no such creator`);
      continue;
    }
    if (row.creator_name?.trim()) {
      skipped.push(`${slug} — already has a brand (${row.creator_name})`);
      continue;
    }
    planned.push({ row, brand: row.display_name, person });
  }

  console.log(`── PLANNED (${planned.length}) ──`);
  for (const { row, brand, person } of planned) {
    console.log(`\n${row.slug}`);
    console.log(`  brand  (creator_name): ${JSON.stringify(brand)}`);
    console.log(`  person (display_name): ${JSON.stringify(person)}`);
    console.log(`  card renders: ${brand}  /  (${person})`);
  }

  if (skipped.length) {
    console.log(`\n\n── SKIPPED (${skipped.length}) ──`);
    for (const s of skipped) console.log(`  ${s}`);
  }

  // Anything brand-shaped that this script does not know about.
  const unresolved = rows
    .filter((r) => r.slug && !r.creator_name?.trim())
    .filter((r) => !PERSON_BY_SLUG[r.slug as string])
    .filter((r) => !ORGANISATIONS.has(r.slug as string))
    .map((r) => r.display_name);

  console.log(`\n\n── UNRESOLVED (${unresolved.length}) — no person recorded, left alone ──`);
  console.log("Some are already people's own names and need nothing; others need a name supplied.");
  for (const n of unresolved) console.log(`  ${n}`);

  console.log(`\n\n── ORGANISATIONS (${ORGANISATIONS.size}) — intentionally brand-only ──`);
  for (const s of ORGANISATIONS) console.log(`  ${s}`);

  if (!EXECUTE) {
    console.log(`\n\nDry run — nothing written. Re-run with --execute to apply ${planned.length} update(s).`);
    return;
  }

  console.log(`\n\nApplying ${planned.length} updates…`);
  let ok = 0;
  for (const { row, brand, person } of planned) {
    const up = await graphql(
      `mutation ($id: uuid!, $brand: String!, $person: String!) {
         update_creators_by_pk(pk_columns: { id: $id }, _set: { creator_name: $brand, display_name: $person }) { id }
       }`,
      { useAdminSecret: true, variables: { id: row.id, brand, person } }
    );
    if (up.errors?.length) console.error(`  FAILED ${row.slug}: ${up.errors[0].message}`);
    else ok += 1;
  }
  console.log(`Done — ${ok}/${planned.length} updated.`);
}

await main();
