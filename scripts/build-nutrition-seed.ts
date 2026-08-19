// Fold the whole FoodLP export into ONE self-describing row per food, ready to seed the
// backend `nutrition` table. Nothing from the export is dropped: the 21,700 food_nutrients
// rows collapse into a per-food `nutrients` map that keeps each value's own source tier and
// citation, and the foods/source-list/vegan_classifications/serving_sizes/shopping_list_items
// tables are folded in alongside.
//
//   bun scripts/build-nutrition-seed.ts                 # -> scripts/data/nutrition-seed.jsonl
//   bun scripts/build-nutrition-seed.ts --pretty        # also write a readable sample
//
// Shape (one JSON object per line):
//   fdc_id, name, source{}, flags{}, cost{}, nutrition{ researched_at, count, values{} },
//   vegan_classification{}, serving_sizes[], shopping_list_item{}, provenance{}
//
// `nutrition.values[key]` = { value_per_100g, unit, label, group, source_tier,
//                             source_description, source_fdc_id, source_url }
// so a consumer can render a full panel with per-nutrient attribution and no joins.
export {};

import { NUTRIENT_META, ALL_NUTRIENT_KEYS } from "../lib/nutrition/gamut";

const DIR = "scripts";
const OUT = "scripts/data/nutrition-seed.jsonl";
const pretty = process.argv.includes("--pretty");

function parseCSV(t: string): string[][] {
  const R: string[][] = []; let r: string[] = [], c = "", q = false;
  for (let i = 0; i < t.length; i++) { const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else { if (ch === '"') q = true; else if (ch === ",") { r.push(c); c = ""; } else if (ch === "\n") { r.push(c); R.push(r); r = []; c = ""; } else if (ch === "\r") {} else c += ch; } }
  if (c.length || r.length) { r.push(c); R.push(r); }
  return R;
}
async function readTable(file: string): Promise<Record<string, string>[]> {
  const f = Bun.file(file);
  if (!(await f.exists())) { console.warn(`  (missing: ${file})`); return []; }
  const t = parseCSV(await f.text());
  if (!t.length) return [];
  const head = t[0];
  return t.slice(1).filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((k, n) => [k, r[n] ?? ""])));
}

// ── UNIT NORMALISATION ────────────────────────────────────────────────────────────────
// The FoodLP pipeline stored some nutrients in a DIFFERENT unit from the one lib/nutrition/
// gamut.ts declares, because the seed-research flowchart's nutrient-ref block disagreed with
// the gamut. The blob then stamped gamut's unit onto FoodLP's number, producing values that
// are silently wrong by orders of magnitude while *looking* correctly labelled.
//
//   fluoride   flowchart mg,  gamut µg  -> stored value is 1000x too small
//   vitamin_d  flowchart IU,  gamut µg  -> stored value is 40x too large
//
// Evidence for fluoride: the export's own citations say so, e.g.
//   "USDA FDC #169345 (Fluoride 18.0 ug = 0.018 mg)"  with 0.018 stored.
// And the magnitudes confirm it — real fluoride in plant foods is ~1-50 µg/100g, while every
// stored value falls in 0.001-0.055.
//
// This MUST live here, in the generator, not as a patch against the database. A prod-side
// UPDATE is reverted the next time the loader runs, because seed-nutrition-vegan.ts lists
// `metadata` in on_conflict.update_columns and replaces the whole blob. That already
// happened once.
const UNIT_FIXUPS: Record<string, { factor: number; from: string; to: string; why: string }> = {
  fluoride: {
    factor: 1000, from: "mg", to: "µg",
    why: "FoodLP stored mg (per the seed-research nutrient-ref block); gamut.ts and USDA use µg",
  },
  vitamin_d: {
    factor: 1 / 40, from: "IU", to: "µg",
    why: "FoodLP stored IU; gamut.ts uses µg. 1 µg cholecalciferol = 40 IU",
  },
};

const bool = (v: string) => v === "1" || v.toLowerCase() === "true";
const numOrNull = (v: string) => (v === "" || v == null ? null : Number(v));
const strOrNull = (v: string) => (v === "" || v == null ? null : v);

// Citations are free text and the pipeline wrote them a dozen ways:
//   "USDA FDC #168385 (SR Legacy), https://…"
//   "USDA FoodData Central, SR Legacy, FDC #168385 (Amaranth leaves, raw); https://…"
//   "USDA FoodData Central, SR Legacy, FDC ID 167782 (Abiyuch, raw); https://…"
//   "Derived by summation of USDA FDC #168385 components: Methionine 0.036 + Cystine 0.029 g"
//   "Pacific Coast Producers '…' nutrition label: 13 g total sugars per 1/2-cup serving; …"
// Keep the raw string verbatim and pull out what's worth querying on.
function parseSourceDescription(d: string) {
  const url = d.match(/https?:\/\/[^\s)'";]+/)?.[0] ?? null;
  const fdc = d.match(/#(\d+)/)?.[1]
    ?? d.match(/FDC\s*ID\s*(\d+)/i)?.[1]
    ?? d.match(/food-details\/(\d+)/)?.[1]
    ?? null;
  const dataType = d.match(/\b(SR Legacy|Foundation|Branded|Survey \(FNDDS\)|Experimental)\b/i)?.[1] ?? null;
  const derived = /^derived\b|\bderived by\b|\bby summation\b|\bcomputed\b|\bcalculated\b/i.test(d);
  // what kind of evidence backs this value — lets a consumer weight or filter without regex
  const kind = derived ? "derived" : fdc ? "usda_fdc" : /nutrition label|label:/i.test(d) ? "product_label" : "other";
  return { source_fdc_id: fdc ? Number(fdc) : null, source_url: url, source_data_type: dataType, source_kind: kind };
}

console.log("reading export…");
const [foods, nutrients, veganCls, servings, shopping] = await Promise.all([
  readTable(`${DIR}/foods.csv`),
  readTable(`${DIR}/food_nutrients.csv`),
  readTable(`${DIR}/vegan_classifications.csv`),
  readTable(`${DIR}/serving_sizes.csv`),
  readTable(`${DIR}/shopping_list_items.csv`),
]);
const sourceList: any[] = JSON.parse(await Bun.file(`${DIR}/source-list/usda-foodlist-ranked.json`).text());
console.log(`  foods=${foods.length} food_nutrients=${nutrients.length} vegan_classifications=${veganCls.length} serving_sizes=${servings.length} shopping_list_items=${shopping.length} source_list=${sourceList.length}`);

// --- index the child tables by food_id -------------------------------------------------
const nutrientsByFood = new Map<string, Record<string, string>[]>();
for (const n of nutrients) (nutrientsByFood.get(n.food_id) ?? nutrientsByFood.set(n.food_id, []).get(n.food_id)!).push(n);
const servingsByFood = new Map<string, Record<string, string>[]>();
for (const s of servings) (servingsByFood.get(s.food_id) ?? servingsByFood.set(s.food_id, []).get(s.food_id)!).push(s);
const shoppingByFood = new Map(shopping.map((s) => [s.food_id, s]));
const sourceByFdc = new Map(sourceList.map((s) => [String(s.fdcId), s]));
const veganByName = new Map(veganCls.map((v) => [v.food_name.toLowerCase().trim(), v]));

const unknownKeys = new Set<string>();
const stats = { withNutrition: 0, shells: 0, noSourceRow: 0, veganMatched: 0, tiers: {} as Record<string, number>, unitFixed: {} as Record<string, number> };
const lines: string[] = [];
const generatedAt = new Date().toISOString();

for (const f of foods) {
  const src = sourceByFdc.get(f.fdc_id) ?? null;
  if (!src) stats.noSourceRow++;

  // --- nutrients: one entry per key, carrying its own tier + citation -------------------
  const rows = nutrientsByFood.get(f.id) ?? [];
  const values: Record<string, unknown> = {};
  for (const n of rows) {
    const key = n.nutrient_key;
    const meta = NUTRIENT_META[key];
    if (!meta) unknownKeys.add(key);
    stats.tiers[n.source_tier] = (stats.tiers[n.source_tier] ?? 0) + 1;
    const parsed = parseSourceDescription(n.source_description ?? "");
    const fix = UNIT_FIXUPS[key];
    const raw = Number(n.value_per_100g);
    if (fix && raw !== 0) stats.unitFixed[key] = (stats.unitFixed[key] ?? 0) + 1;
    values[key] = {
      value_per_100g: fix ? Number((raw * fix.factor).toPrecision(6)) : raw,
      unit: meta?.unit ?? null,
      ...(fix
        ? { unit_correction: { from: fix.from, to: fix.to, factor: fix.factor, raw_value: raw, why: fix.why } }
        : {}),
      label: meta?.label ?? null,
      group: meta?.group ?? null,
      source_tier: Number(n.source_tier),
      source_description: strOrNull(n.source_description),
      ...parsed,
      foodlp_nutrient_row_id: Number(n.id),
    };
  }
  if (rows.length) stats.withNutrition++; else stats.shells++;

  const vc = veganByName.get(f.name.toLowerCase().trim()) ?? null;
  if (vc) stats.veganMatched++;
  const sl = shoppingByFood.get(f.id) ?? null;

  lines.push(JSON.stringify({
    fdc_id: Number(f.fdc_id),
    name: f.name,

    // where this food came from and how it ranks in the research queue
    source: {
      provider: "usda_fdc",
      data_type: src?.dataType ?? null,
      category: src?.category ?? null,
      research_tier: src?.tier ?? null,
      research_rank: src?.rank ?? null,
      url: `https://fdc.nal.usda.gov/food-details/${f.fdc_id}/nutrients`,
    },

    // per-food modelling flags carried by the FoodLP schema
    flags: {
      is_vegan: bool(f.is_vegan),
      is_supplement: bool(f.is_supplement),
      is_phytate_rich: bool(f.is_phytate_rich),
      is_precomputed: bool(f.is_precomputed),
      calcium_absorption_factor: numOrNull(f.calcium_absorption_factor),
      brand: strOrNull(f.brand),
    },

    // unpopulated in this snapshot, kept so the shape doesn't change when it fills in
    cost: {
      per_100g_usd: numOrNull(f.cost_per_100g_usd),
      source_tier: numOrNull(f.cost_source_tier),
      source_description: strOrNull(f.cost_source_description),
      collected_at: strOrNull(f.cost_collected_at),
    },

    nutrition: {
      researched_at: strOrNull(f.nutrition_researched_at),
      is_researched: rows.length > 0,
      count: rows.length,
      // which of the canonical 92 are absent — the gap list, precomputed for querying
      missing_keys: rows.length ? ALL_NUTRIENT_KEYS.filter((k) => !(k in values)) : [],
      values,
    },

    vegan_classification: vc ? {
      classification: vc.classification,
      rewritten_name: strOrNull(vc.rewritten_name),
      cached_at: strOrNull(vc.cached_at),
    } : null,

    serving_sizes: (servingsByFood.get(f.id) ?? []).map((s) => ({
      description: s.description, grams: Number(s.grams),
    })),

    shopping_list_item: sl ? {
      max_daily_amount_text: strOrNull(sl.max_daily_amount_text),
      max_daily_amount_grams: numOrNull(sl.max_daily_amount_grams),
      excluded: bool(sl.excluded),
      sort_order: Number(sl.sort_order),
    } : null,

    // trace back to the export this row was built from
    provenance: {
      export: "foodlp-db-export",
      foodlp_food_id: Number(f.id),
      foodlp_created_at: strOrNull(f.created_at),
      foodlp_updated_at: strOrNull(f.updated_at),
      generated_at: generatedAt,
    },
  }));
}

await Bun.write(OUT, lines.join("\n") + "\n");

console.log(`\n${lines.length} rows -> ${OUT}`);
console.log(`  with nutrition: ${stats.withNutrition} · shells: ${stats.shells}`);
console.log(`  vegan_classification matched: ${stats.veganMatched} · foods missing a source-list row: ${stats.noSourceRow}`);
console.log(`  nutrient values by source_tier:`, stats.tiers);
if (unknownKeys.size) console.warn(`  ⚠ nutrient_keys not in the 92-key gamut: ${[...unknownKeys].join(", ")}`);
else console.log(`  all nutrient_keys are within the canonical ${ALL_NUTRIENT_KEYS.length}-key gamut`);

if (pretty) {
  const sample = JSON.parse(lines.find((l) => JSON.parse(l).nutrition.is_researched)!);
  await Bun.write("scripts/data/nutrition-seed.sample.json", JSON.stringify(sample, null, 2));
  console.log(`  sample -> scripts/data/nutrition-seed.sample.json`);
}
