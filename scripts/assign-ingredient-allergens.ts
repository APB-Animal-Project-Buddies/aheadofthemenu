// Backfill allergens onto pool ingredients by keyword-matching their name + synonyms.
// Best-effort auto-assignment — people can fix any row later in the recipe form /
// admin. UNION semantics: only adds detected allergens, never removes existing ones.
//
// Usage:
//   bun run scripts/assign-ingredient-allergens.ts            # dry run (prints changes)
//   bun run scripts/assign-ingredient-allergens.ts --apply    # write the changes
//
// Requires the `allergens` column (migration 1782400000000_add_ingredient_allergens)
// to be applied to Nhost first.
import { graphql } from "../lib/nhost";

const APPLY = process.argv.includes("--apply");

// Order matters only for readability; all matching rules apply (a row can get several).
// Keep patterns specific to avoid false positives (e.g. don't match bare "nut", which
// would wrongly catch coconut / butternut / nutmeg / doughnut).
const RULES: Array<[RegExp, string]> = [
  [/peanut/i, "peanuts"],
  [/coconut/i, "coconut"],
  [/\b(walnut|almond|cashew|pecan|pistachio|hazelnut|macadamia|pine ?nut|brazil ?nut|tree ?nut|mixed nuts|chestnut|nut butter)\b/i, "nuts"],
  [/\b(wheat|bread|breadcrumb|flour|barley|rye|pasta|noodle|seitan|couscous|bulgur|cracker|gluten|farro|semolina|spelt|udon|soy sauce|panko)\b/i, "gluten"],
  [/\b(milk|cheese|butter|cream|yogurt|yoghurt|ghee|whey|casein|paneer|custard|dairy|mozzarella|parmesan|cheddar|ricotta)\b/i, "dairy"],
  [/\begg(s)?\b/i, "eggs"],
  [/\b(soy|soya|tofu|edamame|tempeh|miso|tamari)\b/i, "soy"],
  [/\b(sesame|tahini)\b/i, "sesame"],
  [/\b(shrimp|prawn|crab|lobster|clam|mussel|oyster|scallop|shellfish|crayfish|squid|octopus|calamari)\b/i, "shellfish"],
  [/\b(fish|anchovy|salmon|tuna|cod|sardine|mackerel|herring|trout|haddock|tilapia|fish sauce)\b/i, "fish"],
];

function detect(text: string): string[] {
  const out = new Set<string>();
  for (const [re, allergen] of RULES) if (re.test(text)) out.add(allergen);
  return [...out];
}

const res = await graphql<{ ingredients: Array<{ id: string; name: string; synonyms: string[]; allergens: string[] }> }>(
  `query { ingredients(where: { alias_of: { _is_null: true } }) { id name synonyms allergens } }`,
  { useAdminSecret: true }
);
if (res.errors?.length) {
  console.error("Query failed (is the `allergens` migration applied?):", res.errors);
  process.exit(1);
}
const ings = res.data?.ingredients ?? [];
console.log(`Scanning ${ings.length} ingredients…`);

const changes: Array<{ id: string; name: string; from: string[]; to: string[] }> = [];
for (const ing of ings) {
  const detected = detect([ing.name, ...(ing.synonyms || [])].join(" "));
  if (!detected.length) continue;
  const cur = [...(ing.allergens || [])].sort();
  const merged = Array.from(new Set([...(ing.allergens || []), ...detected])).sort();
  if (JSON.stringify(merged) !== JSON.stringify(cur)) {
    changes.push({ id: ing.id, name: ing.name, from: ing.allergens || [], to: merged });
  }
}

console.log(`${changes.length} ingredient(s) would change:`);
for (const c of changes.slice(0, 80)) console.log(`  ${c.name}: [${c.from.join(", ")}] -> [${c.to.join(", ")}]`);
if (changes.length > 80) console.log(`  …and ${changes.length - 80} more`);

if (!APPLY) {
  console.log("\nDry run — re-run with --apply to write these changes.");
  process.exit(0);
}

let done = 0;
for (const c of changes) {
  const m = await graphql(
    `mutation ($id: String!, $a: [String!]!) {
       update_ingredients(where: { id: { _eq: $id } }, _set: { allergens: $a }) { affected_rows }
     }`,
    { useAdminSecret: true, variables: { id: c.id, a: c.to } }
  );
  if (m.errors?.length) { console.error("  failed:", c.name, m.errors[0]?.message); continue; }
  done++;
}
console.log(`Applied ${done}/${changes.length}.`);
