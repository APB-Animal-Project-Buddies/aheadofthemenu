// Purge non-vegan ingredients from the backend `ingredients` table, keeping the
// catalog vegan. Detection combines the row's own `vegan` flag with keyword
// matching over name + all synonyms.
//
// Decision order for each row (name + synonyms, lowercased):
//   1. vegan === true                      -> KEEP  (confirmed vegan)
//   2. contains "vegan" / "vegetarian"     -> KEEP  (e.g. "vegan bacon", "vegetarian rennet")
//   3. vegan === false                     -> REMOVE (confirmed non-vegan; also catches
//                                              animal E-numbers, lactose, casein, honey…)
//   4. matches a HARD animal term          -> REMOVE (meat, poultry, seafood, egg, honey,
//                                              gelatin, whey, named cheeses…)
//   5. matches a SOFT dairy term           -> REMOVE, UNLESS a plant word appears *before*
//                                              the dairy word: "coconut milk" stays,
//                                              "milk spread with coconut" goes.
//   6. otherwise                           -> KEEP
//
// Bare "broth" / "stock" / "bouillon" are NOT keywords — veggie broth and
// mushroom stock survive; "beef broth" is caught by "beef".
//
// Usage:
//   bun scripts/purge-meat-ingredients.ts                 # dry run against the live DB
//   bun scripts/purge-meat-ingredients.ts --source seed   # dry run against the local seed file (offline)
//   bun scripts/purge-meat-ingredients.ts --apply         # delete from the live DB
//   bun scripts/purge-meat-ingredients.ts --prune-seed    # rewrite the local seed file, dropping non-vegan rows
import { readFileSync, writeFileSync } from "node:fs";
import { graphql } from "../lib/nhost";

const SEED_PATH = "scripts/data/ingredients-seed.json";

type Row = { id: string; name: string; synonyms: string[]; vegan: boolean | null };

// Always non-vegan: meat, poultry, seafood, eggs, honey, and dairy/animal terms
// that have no plant version. Organ words with plant homonyms (heart, blood,
// tongue) are omitted — they're always qualified ("pork heart" → "pork").
const HARD_ANIMAL = [
  // red meat & pork
  "beef", "veal", "cow", "ox", "oxtail", "steak", "pork", "pig", "piglet", "ham",
  "bacon", "lard", "gammon", "prosciutto", "pancetta", "speck", "capicola",
  "guanciale", "salami", "sausage", "chorizo", "pepperoni", "mortadella",
  "bratwurst", "frankfurter", "wurst", "pastrami", "bresaola", "lardon",
  "scrapple", "mutton", "lamb", "goat", "venison", "bison", "buffalo", "rabbit",
  "hare", "horse", "kangaroo", "camel", "donkey", "bull", "boar", "meat",
  "flesh", "haggis", "pâté", "rillette",
  // poultry
  "poultry", "chicken", "hen", "turkey", "duck", "goose", "quail", "pheasant",
  "partridge", "pigeon", "squab", "foie gras",
  // offal / animal byproduct
  "offal", "liver", "kidney", "tripe", "gizzard", "sweetbread", "trotter",
  "snout", "gelatin", "gelatine", "collagen", "tallow", "jerky", "rennet",
  "crustacean",
  // seafood
  "fish", "shellfish", "seafood", "salmon", "tuna", "cod", "haddock", "pollock",
  "halibut", "tilapia", "trout", "bass", "mackerel", "herring", "sardine",
  "anchovy", "snapper", "sole", "flounder", "perch", "carp", "catfish", "eel",
  "sturgeon", "caviar", "roe", "corvina", "wolffish", "garfish", "monkfish",
  "swordfish", "marlin", "mahi", "shrimp", "prawn", "crab", "lobster", "crayfish",
  "crawfish", "oyster", "clam", "mussel", "scallop", "squid", "octopus",
  "cuttlefish", "calamari", "snail", "escargot", "abalone", "krill", "surimi",
  "whelk", "cockle", "langoustine", "scampi",
  // eggs, bee products, dairy-only terms (no plant version)
  "egg", "honey", "royal jelly", "propolis", "beeswax", "whey", "casein",
  "caseinate", "lactose", "lactalbumin", "lysozyme", "buttermilk", "butterfat",
  "milkfat", "quark",
  // specific cheeses (don't contain the word "cheese")
  "mascarpone", "mozzarella", "parmigiano", "parmesan", "mimolette", "brie",
  "cheddar", "gouda", "ricotta", "feta", "paneer", "emmental", "gruyere",
  "gruyère", "comté", "comte", "edam", "camembert", "provolone", "halloumi",
  "manchego", "pecorino", "gorgonzola", "stilton", "roquefort", "raclette",
  "reblochon", "munster", "abondance", "beaufort", "cantal", "grana padano",
  "laguiole", "rocamadour", "crottin", "picodon", "sainte maure",
];

// Dairy words that DO have plant versions. Removed unless a plant word appears
// earlier in the string (handled in classify): "coconut milk" stays,
// "milk spread with coconut" goes, "shea butter" stays, "yogurt coating" goes.
const SOFT_DAIRY = [
  "milk", "cheese", "butter", "cream", "yogurt", "yoghurt", "ghee", "curd",
  "custard", "kefir", "suet",
];

// Plant signals. Their presence *before* a soft-dairy word keeps the row.
const PLANT = [
  "vegetable", "veggie", "plant", "mushroom", "palm", "artichoke", "bean",
  "soy", "soya", "tofu", "seitan", "tempeh", "nut", "almond", "cashew",
  "peanut", "hazelnut", "walnut", "pistachio", "macadamia", "pecan", "tigernut",
  "tiger nut", "coconut",
  "coco", "cocoa", "cacao", "shea", "oat", "wheat", "corn", "maize", "rice",
  "potato", "fruit", "orange", "apple", "olive", "sunflower", "sesame", "tahini",
  "avocado", "hemp", "flax", "linseed", "pea", "lentil", "chickpea", "banana",
  "date", "fig", "spelt", "barley", "rye", "quinoa", "carrot", "beet", "spinach",
  "kale", "grain",
];

function buildRegex(words: string[]): RegExp {
  const alts = [...words]
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // Unicode-aware word boundaries so "ham" ∌ "champagne" but "pâté" still matches.
  return new RegExp(`(?<![\\p{L}])(?:${alts.join("|")})(?![\\p{L}])`, "giu");
}

// Plant/fungus foods whose names contain an animal word ("kidney bean",
// "oyster mushroom", "horse bean", "custard apple", "saffron milk cap"). Their
// presence force-keeps the row even against a HARD animal match. None of these
// tokens occur in a genuine animal product in this dataset.
const FORCE_KEEP = [
  "bean", "beans", "mushroom", "mushrooms", "milk cap", "lettuce", "corn salad",
  "custard apple", "custard squash",
];

const HARD_RE = buildRegex(HARD_ANIMAL);
const FORCE_KEEP_RE = buildRegex(FORCE_KEEP);
const SOFT_RE = buildRegex(SOFT_DAIRY);
const PLANT_RE = buildRegex(PLANT);
const VEGAN_WORD_RE = /(?<![\p{L}])(?:vegan|vegetarian)(?![\p{L}])/iu;

function firstIndex(re: RegExp, s: string): number {
  re.lastIndex = 0;
  const m = re.exec(s);
  return m ? m.index : -1;
}

type Verdict = { remove: boolean; reason: string };

function classify(row: Row): Verdict {
  const hay = [row.name, ...(row.synonyms ?? [])].join(" • ").toLowerCase();

  if (row.vegan === true) return { remove: false, reason: "vegan=true" };
  if (VEGAN_WORD_RE.test(hay)) return { remove: false, reason: 'has "vegan/vegetarian"' };
  if (FORCE_KEEP_RE.test(hay)) return { remove: false, reason: "plant/fungus" };
  if (row.vegan === false) return { remove: true, reason: "vegan=false" };

  const hard = firstIndex(HARD_RE, hay);
  if (hard !== -1) {
    HARD_RE.lastIndex = 0;
    return { remove: true, reason: `animal:${HARD_RE.exec(hay)?.[0]}` };
  }

  const soft = firstIndex(SOFT_RE, hay);
  if (soft !== -1) {
    const plant = firstIndex(PLANT_RE, hay);
    if (plant !== -1 && plant < soft) return { remove: false, reason: "plant-before-dairy" };
    SOFT_RE.lastIndex = 0;
    return { remove: true, reason: `dairy:${SOFT_RE.exec(hay)?.[0]}` };
  }

  return { remove: false, reason: "no-match" };
}

async function fetchAllFromDb(): Promise<Row[]> {
  const rows: Row[] = [];
  const LIMIT = 1000;
  for (let offset = 0; ; offset += LIMIT) {
    const res = await graphql<{ ingredients: Row[] }>(
      `query Page($limit: Int!, $offset: Int!) {
         ingredients(limit: $limit, offset: $offset, order_by: { id: asc }) {
           id name synonyms vegan
         }
       }`,
      { useAdminSecret: true, variables: { limit: LIMIT, offset } }
    );
    if (res.errors?.length) throw new Error(JSON.stringify(res.errors));
    const page = res.data?.ingredients ?? [];
    rows.push(...page);
    if (page.length < LIMIT) break;
  }
  return rows;
}

function fetchAllFromSeed(): Row[] {
  const seed = JSON.parse(readFileSync(SEED_PATH, "utf8")) as Row[];
  return seed.map((s) => ({ id: s.id, name: s.name, synonyms: s.synonyms ?? [], vegan: s.vegan ?? null }));
}

// Rewrite the committed seed file in place, dropping non-vegan rows. Original
// row objects (including off_id and any other fields) are preserved untouched.
function pruneSeed(): void {
  const seed = JSON.parse(readFileSync(SEED_PATH, "utf8")) as Array<
    Record<string, unknown> & { name: string; synonyms?: string[]; vegan?: boolean | null }
  >;
  const kept = seed.filter(
    (s) => !classify({ id: "", name: s.name, synonyms: s.synonyms ?? [], vegan: s.vegan ?? null }).remove
  );
  writeFileSync(SEED_PATH, JSON.stringify(kept));
  console.log(`\nPruned seed: ${seed.length} -> ${kept.length} (removed ${seed.length - kept.length}). Wrote ${SEED_PATH}`);
}

async function deleteFromDb(ids: string[]): Promise<number> {
  // Detach surviving rows that alias a doomed row (alias_of FK -> ingredients.id).
  const detach = await graphql<{ update_ingredients: { affected_rows: number } }>(
    `mutation Detach($ids: [String!]!) {
       update_ingredients(where: { alias_of: { _in: $ids } }, _set: { alias_of: null }) { affected_rows }
     }`,
    { useAdminSecret: true, variables: { ids } }
  );
  if (detach.errors?.length) throw new Error(JSON.stringify(detach.errors));
  const detached = detach.data?.update_ingredients?.affected_rows ?? 0;
  if (detached) console.log(`  detached ${detached} alias_of reference(s)`);

  const BATCH = 500;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += BATCH) {
    const slice = ids.slice(i, i + BATCH);
    const res = await graphql<{ delete_ingredients: { affected_rows: number } }>(
      `mutation Del($ids: [String!]!) {
         delete_ingredients(where: { id: { _in: $ids } }) { affected_rows }
       }`,
      { useAdminSecret: true, variables: { ids: slice } }
    );
    if (res.errors?.length) throw new Error(JSON.stringify(res.errors));
    deleted += res.data?.delete_ingredients?.affected_rows ?? 0;
    console.log(`  ${Math.min(i + BATCH, ids.length)}/${ids.length}`);
  }
  return deleted;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const pruneSeedMode = process.argv.includes("--prune-seed");
  const si = process.argv.indexOf("--source");
  const source = pruneSeedMode || (si !== -1 && process.argv[si + 1] === "seed") ? "seed" : "db";

  console.log(`Scanning ingredients from ${source}${apply ? " (APPLY)" : " (dry run)"}…`);
  const rows = source === "seed" ? fetchAllFromSeed() : await fetchAllFromDb();
  console.log(`Loaded ${rows.length} ingredients.`);

  const remove: Array<{ row: Row; reason: string }> = [];
  const reasonCounts = new Map<string, number>();
  for (const row of rows) {
    const v = classify(row);
    if (v.remove) {
      remove.push({ row, reason: v.reason });
      const key = v.reason.split(":")[0];
      reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
    }
  }

  console.log("\n=== TO REMOVE (full list) ===");
  for (const { row, reason } of [...remove].sort((a, b) => a.row.name.localeCompare(b.row.name))) {
    console.log(`  ${row.name}   ·   [${reason}]`);
  }

  console.log("\n=== summary by reason ===");
  for (const [k, n] of [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${n}`);
  }
  console.log(`\n${remove.length} non-vegan ingredient(s) flagged out of ${rows.length}.`);

  if (pruneSeedMode) {
    pruneSeed();
    return;
  }
  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to delete from the live DB, or --prune-seed to rewrite the seed file.");
    return;
  }
  if (source === "seed") {
    console.log("\nRefusing to --apply against the seed source; use --prune-seed to rewrite it.");
    process.exit(1);
  }
  if (remove.length === 0) return;

  console.log("\nDeleting from live DB…");
  const deleted = await deleteFromDb(remove.map((h) => h.row.id));
  console.log(`Done. Deleted ${deleted} ingredient(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
