/**
 * Translate static /recipes content into /dishes records.
 *
 * Usage:
 *   bun scripts/translate-recipes-to-dishes.ts            # dry-run (default): purely local,
 *                                                         #   parses + maps + writes a review JSON,
 *                                                         #   NO env reads, NO network.
 *   bun scripts/translate-recipes-to-dishes.ts --execute  # idempotent insert into the dishes table.
 *
 * Scope (first batch): the 8 "Chef Gauthier Soho" recipes in public/recipes/data/french.json.
 *
 * Format: every record is built through lib/dishes.buildDishData, so the output is exactly the
 * current dish_data schema (incl. the 1–3 `difficulty` effort field and fraction-aware quantities).
 *
 * Deliberately NOT translated yet (per request): pricing (`cost`/`menuPrice`) and substitutions
 * (`subs`/`alternatives`). Steps are omitted too — these are externally-attributed recipes, so we
 * link to the source (`resourceLink`) + credit the creator (`originalCreator`) instead of copying
 * the method verbatim.
 *
 * Idempotency (--execute only): each dish is matched by dish_name before insert; re-runs are no-ops
 * and print `created` vs `existed`.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDishData, ALLERGENS, TAGS, UNITS } from "../lib/dishes";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE_FILE = join(HERE, "..", "public", "recipes", "data", "french.json");
const REVIEW_OUT = join(HERE, "data", "gauthier-french-dishes.dryrun.json");
const CREATOR_MATCH = /gauthier/i; // "Chef Gauthier Soho (Michelin Star)"

// Normalize noisy `source` strings to the actual creator's name. The recipe data credits the
// restaurant ("Chef Gauthier Soho (Michelin Star)"); the chef is Alexis Gauthier.
const CREATOR_OVERRIDES: Array<[RegExp, string]> = [
  [/gauthier/i, "Alexis Gauthier"],
];
function normalizeCreator(source: unknown): string | undefined {
  const s = typeof source === "string" ? source.trim() : "";
  if (!s) return undefined;
  for (const [re, name] of CREATOR_OVERRIDES) if (re.test(s)) return name;
  return s;
}

// recipe `courses` → allowed dish_data `dishType`. Unmapped (e.g. "showstopper") is dropped.
const COURSE_MAP: Record<string, string> = {
  starter: "appetizer", appetizer: "appetizer", main: "main", side: "side",
  soup: "soup", salad: "salad", dessert: "dessert", breakfast: "breakfast",
  drink: "drink", snack: "snack", sauce: "sauce",
};

// unit word (singular/plural) → allowed UNITS enum. Anything unmapped stays part of the name.
const UNIT_MAP: Record<string, string> = {
  tablespoon: "tbsp", tablespoons: "tbsp", tbsp: "tbsp", tbsps: "tbsp",
  teaspoon: "tsp", teaspoons: "tsp", tsp: "tsp", tsps: "tsp",
  cup: "cup", cups: "cup",
  clove: "clove", cloves: "clove",
  ounce: "oz", ounces: "oz", oz: "oz",
  pound: "lb", pounds: "lb", lb: "lb", lbs: "lb",
  gram: "g", grams: "g", g: "g",
  kilogram: "kg", kilograms: "kg", kg: "kg",
  milliliter: "ml", milliliters: "ml", ml: "ml",
  liter: "l", liters: "l", litre: "l", litres: "l", l: "l",
  pinch: "pinch", pinches: "pinch", dash: "dash", dashes: "dash", splash: "splash",
  can: "can", cans: "can", piece: "piece", pieces: "piece",
  handful: "handful", handfuls: "handful", bunch: "bunch", bunches: "bunch",
  sprig: "sprig", sprigs: "sprig", stick: "stick", sticks: "stick", cube: "cube", cubes: "cube",
};

const ALLOWED_ALLERGENS = new Set<string>(ALLERGENS as readonly string[]);
const ALLOWED_TAGS = new Set<string>(TAGS as readonly string[]);
const ALLOWED_UNITS = new Set<string>(UNITS as readonly string[]);

// ---------------------------------------------------------------------------
// Ingredient line parser (local heuristic)
// ---------------------------------------------------------------------------

// Leading amount: mixed number ("1 1/2"), fraction ("2/3"), decimal/int ("1.5", "3"), or a
// unicode fraction ("½"), optionally a range ("2-3"). Kept as written — buildDishData preserves
// fractions as text and coerces plain numbers to numbers.
const AMT = "(?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+(?:\\.\\d+)?|[¼-¾⅐-⅞])";
const LEAD_QTY_RE = new RegExp(`^\\s*(${AMT}(?:\\s*[-–]\\s*${AMT})?)\\s*`);

type ParsedLine = { name: string; quantity: string; unit: string; note?: string };

function parseIngredientLine(raw: string): ParsedLine | null {
  let line = String(raw ?? "").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  if (!line) return null;

  // Pull a trailing prep/serving qualifier into a note.
  let note: string | undefined;
  const trailing = line.match(/\b(to taste|for garnish|for serving|for lining|to serve)\b.*$/i);
  if (trailing) { note = trailing[1].toLowerCase(); line = line.slice(0, trailing.index).trim(); }

  // A comma usually separates the item from its prep ("garlic, minced").
  const comma = line.indexOf(",");
  if (comma !== -1) {
    const prep = line.slice(comma + 1).trim();
    if (prep) note = note ? `${prep}; ${note}` : prep;
    line = line.slice(0, comma).trim();
  }

  // Leading quantity, then an optional unit word.
  let quantity = "";
  const q = line.match(LEAD_QTY_RE);
  if (q) { quantity = q[1].trim(); line = line.slice(q[0].length).trim(); }

  let unit = "";
  const firstWord = line.split(/\s+/)[0]?.toLowerCase().replace(/[.,]$/, "");
  if (firstWord && UNIT_MAP[firstWord]) {
    unit = UNIT_MAP[firstWord];
    line = line.slice(line.indexOf(line.split(/\s+/)[0]) + line.split(/\s+/)[0].length).trim();
  }

  // "salt and pepper to taste" with no unit → mark the unit as to_taste.
  if (!unit && note === "to taste") unit = "to_taste";

  const name = line.trim();
  if (!name) return null;
  const out: ParsedLine = { name, quantity, unit };
  if (note) out.note = note;
  return out;
}

// ---------------------------------------------------------------------------
// Recipe → buildDishData input
// ---------------------------------------------------------------------------

const DIFF_WORD: Record<string, number> = { easy: 1, medium: 2, moderate: 2, hard: 3, difficult: 3, advanced: 3 };

function mapDifficulty(r: any): number | undefined {
  if (typeof r.difficulty === "number" && r.difficulty >= 1 && r.difficulty <= 3) return r.difficulty;
  const label = String(r.difficultyLabel ?? "").toLowerCase();
  // "Easy-Medium" → take the higher tier so effort isn't understated.
  const hits = Object.keys(DIFF_WORD).filter((w) => label.includes(w)).map((w) => DIFF_WORD[w]);
  return hits.length ? Math.max(...hits) : undefined; // undefined → buildDishData defaults to 2
}

function isHttp(u: unknown): u is string {
  return typeof u === "string" && /^https?:\/\/\S+$/i.test(u);
}

function recipeToDishInput(r: any) {
  const dishType = Array.from(
    new Set((Array.isArray(r.courses) ? r.courses : []).map((c: string) => COURSE_MAP[String(c).toLowerCase()]).filter(Boolean))
  );
  const tags = (Array.isArray(r.tags) ? r.tags : []).filter((t: string) => ALLOWED_TAGS.has(t));
  const allergens = (Array.isArray(r.allergens) ? r.allergens : []).filter((a: string) => ALLOWED_ALLERGENS.has(a));
  const ingredients = (Array.isArray(r.ingredients) ? r.ingredients : [])
    .map(parseIngredientLine)
    .filter(Boolean);

  return {
    title: r.title,
    description: r.description,
    cuisines: r.cuisine ? [r.cuisine] : [],
    dishType,
    tags,
    ingredients,
    steps: [], // externally attributed — link to source instead of reproducing the method
    allergens,
    resourceLink: isHttp(r.url) ? r.url : undefined,
    originalCreator: normalizeCreator(r.source),
    servings: typeof r.servings === "number" ? r.servings : undefined,
    prepTime: r.prep || r.time || undefined,
    difficulty: mapDifficulty(r),
    // Intentionally skipped for now: cost/menuPrice (pricing) and subs/alternatives (substitutions).
  };
}

// ---------------------------------------------------------------------------
// Build the batch
// ---------------------------------------------------------------------------

function loadGauthierDishes() {
  const recipes: any[] = JSON.parse(readFileSync(SOURCE_FILE, "utf8"));
  const picked = recipes.filter((r) => CREATOR_MATCH.test(String(r.source ?? "")));
  return picked.map((r) => {
    const input = recipeToDishInput(r);
    const dishData = buildDishData(input); // canonical dish_data — matches the live schema
    return { sourceId: r.id, dishData };
  });
}

// A compact, unit-flagged view so mis-parsed units are easy to spot in review.
function summarize(dishData: any) {
  const ings = (dishData.ingredients ?? []) as any[];
  const oddUnits = Array.from(new Set(ings.map((i) => i.unit).filter((u: string) => u && !ALLOWED_UNITS.has(u))));
  return {
    title: dishData.title,
    dishType: dishData.dishType ?? [],
    tags: dishData.tags ?? [],
    difficulty: dishData.difficulty,
    servings: dishData.servings ?? null,
    ingredientCount: ings.length,
    allergens: dishData.allergens ?? [],
    hasLink: !!dishData.resourceLink,
    creator: dishData.originalCreator ?? null,
    oddUnits, // should be empty
  };
}

// ---------------------------------------------------------------------------
// Execute mode (idempotent inserts) — only reached with --execute
// ---------------------------------------------------------------------------

async function execute(batch: { sourceId: string; dishData: any }[]) {
  const { graphql } = await import("../lib/nhost");
  let created = 0, existed = 0;
  for (const { dishData } of batch) {
    const name = dishData.title as string;
    const found = await graphql<{ dishes: Array<{ id: number }> }>(
      `query ($name: String!) { dishes(where: { dish_name: { _eq: $name } }, limit: 1) { id } }`,
      { useAdminSecret: true, variables: { name } }
    );
    if (found.errors?.length) throw new Error(`lookup failed for "${name}": ${JSON.stringify(found.errors)}`);
    if (found.data?.dishes?.length) { existed++; console.log(`  = exists: ${name}`); continue; }

    const res = await graphql<{ insert_dishes_one: { id: number } }>(
      `mutation ($name: String!, $data: jsonb!) { insert_dishes_one(object: { dish_name: $name, dish_data: $data }) { id } }`,
      { useAdminSecret: true, variables: { name, data: dishData } }
    );
    if (res.errors?.length) throw new Error(`insert failed for "${name}": ${JSON.stringify(res.errors)}`);
    created++; console.log(`  + created: ${name} (id ${res.data?.insert_dishes_one?.id})`);
  }
  console.log(`\nDone. created=${created} existed=${existed} total=${batch.length}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const executeMode = process.argv.slice(2).includes("--execute");
const batch = loadGauthierDishes();

console.log(`Gauthier French recipes → dishes: ${batch.length} record(s)\n`);
console.table(batch.map((b) => summarize(b.dishData)));

if (!executeMode) {
  writeFileSync(REVIEW_OUT, JSON.stringify(batch.map((b) => b.dishData), null, 2));
  console.log(`\nDRY RUN — no DB writes. Full dish_data written to:\n  ${REVIEW_OUT}`);
  console.log(`Review it, then run with --execute to insert (idempotent).`);
} else {
  console.log("EXECUTE — inserting into the dishes table (idempotent by dish_name)...\n");
  await execute(batch);
}
