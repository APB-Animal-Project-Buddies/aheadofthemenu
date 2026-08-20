// Full USDA FoodData Central -> 93-key gamut mapping.
//
// WHY THIS EXISTS: `USDA_NUTRIENT_NUMBER_TO_KEY` in ./nutrients.ts maps by INFOODS nutrient
// NUMBER and covers only 37 of the 93 keys in ./gamut.ts. The FoodLP pipeline carried a
// second, wider mapping keyed by USDA nutrient NAME, embedded in the `seed-bulk-import`
// FlowCoder prompt. Neither alone is sufficient. This module unions them and adds the two
// derived keys, which USDA does not publish at all.
//
// MEASURED against the 21,700 real nutrient values the pipeline produced:
//   by-number map alone .................. 37 keys
//   by-name map alone .................... 83 keys
//   union ................................ 84 keys
//   union + derived sums below ........... 86 keys  = 99.76% of all tier-1 values
// The 51 tier-1 values still unreachable are rare trace minerals (molybdenum 17,
// beta_sitosterol 10, sulfur/cobalt/nickel/boron 5 each, iodine 4) that USDA carries on
// only a handful of Foundation Foods.
import { NUTRIENT_META } from "./gamut";
import { USDA_NUTRIENT_NUMBER_TO_KEY } from "./nutrients";

// USDA nutrient NAME -> canonical gamut key.
export const USDA_NAME_TO_KEY: Record<string, string> = {
  "Energy": "energy",
  "Protein": "protein",
  "Total lipid (fat)": "total_fat",
  "Water": "water",
  "Ash": "ash",
  "Carbohydrate, by difference": "carbohydrate",
  "Fiber, total dietary": "fiber_total",
  "Fiber, soluble": "fiber_soluble",
  "Fiber, insoluble": "fiber_insoluble",
  "Sugars, total including NLEA": "sugars_total",
  "Sugars, Total": "sugars_total",
  "Glucose": "glucose",
  "Glucose (dextrose)": "glucose",
  "Fructose": "fructose",
  "Sucrose": "sucrose",
  "Maltose": "maltose",
  "Galactose": "galactose",
  "Starch": "starch",
  "Fatty acids, total saturated": "saturated_fat",
  "Fatty acids, total monounsaturated": "monounsaturated_fat",
  "Fatty acids, total polyunsaturated": "polyunsaturated_fat",
  "Fatty acids, total trans": "trans_fat",
  // Added after agent nutrition-flowchart flagged that cholesterol was the ONLY gamut key
  // reachable by nutrient NUMBER alone (601) with no name fallback. A USDA release that
  // renumbered it would have silently dropped the nutrient — no error, just an absent key,
  // which is the same "measurement cannot express the failure" shape as everything else in
  // this project. (Its companion flag on sugars_total was wrong: that one has had a name
  // mapping all along.)
  "Cholesterol": "cholesterol",

  // ── ANIMAL-ORIGIN BIOMARKERS ────────────────────────────────────────────────────────
  // Names verified against the live USDA API on FDC #167973, not assumed — getting 418 vs
  // 578 backwards would have been the vitamin_d collision a second time:
  //   #418 "Vitamin B-12"          0.28 µg   <- total, already mapped
  //   #578 "Vitamin B-12, added"      0 µg   <- the discriminator
  //   #607 "SFA 4:0"              0.027 g    <- USDA calls it SFA, not "Butyric acid"
  //   #608 "SFA 6:0"              0.052 g
  // total B-12 > 0 with added == 0 means NATURALLY OCCURRING, which plants cannot produce.
  // That is what makes a B-12 test decidable from stored data rather than defeated by the
  // fortification objection.
  "Vitamin B-12, added": "vitamin_b12_added",
  "SFA 4:0": "butyric_acid",
  "SFA 6:0": "caproic_acid",
  "18:3 n-3 c,c,c (ALA)": "ala",
  "PUFA 18:3": "ala",
  "20:5 n-3 (EPA)": "epa",
  "PUFA 20:5 n-3 (EPA)": "epa",
  "22:6 n-3 (DHA)": "dha",
  "PUFA 22:6 n-3 (DHA)": "dha",
  "18:2 n-6 c,c": "la",
  "PUFA 18:2": "la",
  "20:4 n-6": "aa",
  "PUFA 20:4": "aa",
  "Tryptophan": "tryptophan",
  "Threonine": "threonine",
  "Isoleucine": "isoleucine",
  "Leucine": "leucine",
  "Lysine": "lysine",
  "Methionine": "methionine",
  "Phenylalanine": "phenylalanine",
  "Valine": "valine",
  "Histidine": "histidine",
  "Alanine": "alanine",
  "Arginine": "arginine",
  "Aspartic acid": "aspartic_acid",
  "Glutamic acid": "glutamic_acid",
  "Glycine": "glycine",
  "Proline": "proline",
  "Serine": "serine",
  "Tyrosine": "tyrosine",
  "Cystine": "cystine",
  "Cysteine": "cysteine",
  // 'Taurine' deliberately NOT mapped. It is not in the 94-key gamut, so NUTRIENT_META
  // would be undefined and mapUsdaFood would emit unit: null — which reconcile.ts:114 then
  // resolves to "g", mislabelling a mg-scale nutrient by 10^3. This is the same defect that
  // motivated adding chromium to the gamut. Taurine is also animal-derived, so for a
  // plant-focused dataset its absence is correct rather than a gap. Caught by agent
  // nutrition-flowchart. If taurine is ever wanted, add it to gamut.ts FIRST.
  "Vitamin A, RAE": "vitamin_a_rae",
  "Retinol": "retinol",
  "Carotene, beta": "beta_carotene",
  "Carotene, alpha": "alpha_carotene",
  "Cryptoxanthin, beta": "beta_cryptoxanthin",
  "Vitamin D (D2 + D3)": "vitamin_d",
  // NOTE: 'Vitamin D (D2 + D3), International Units' deliberately NOT here — it needs a
  // ÷40 conversion and lives in NAME_CONVERSIONS below. Mapping it flat, as the original
  // seed-bulk-import dict did, makes the stored value depend on USDA array order and
  // silently writes 40x figures. Caught by agent nutrition-flowchart.
  "Vitamin E (alpha-tocopherol)": "vitamin_e",
  "Vitamin K (phylloquinone)": "vitamin_k",
  "Vitamin C, total ascorbic acid": "vitamin_c",
  "Thiamin": "thiamin",
  "Riboflavin": "riboflavin",
  "Niacin": "niacin",
  "Pantothenic acid": "pantothenic_acid",
  "Vitamin B-6": "vitamin_b6",
  "Folate, total": "folate",
  // NOTE: 'Folic acid' deliberately NOT mapped to `folate`. Folic acid is the SYNTHETIC
  // form and USDA reports it as a separate nutrient alongside total folate — same unit,
  // different substance, and folate_total >= folic_acid. The original dict mapped both,
  // so whichever appeared first in the USDA array won and the stored value was arbitrary.
  // Total folate is what the gamut key means; the synthetic fraction is dropped rather
  // than silently substituted.
  "Vitamin B-12": "vitamin_b12",
  "Biotin": "biotin",
  "Choline, total": "choline",
  "Betaine": "betaine",
  "Calcium, Ca": "calcium",
  "Phosphorus, P": "phosphorus",
  "Magnesium, Mg": "magnesium",
  "Sodium, Na": "sodium",
  "Potassium, K": "potassium",
  "Iron, Fe": "iron",
  "Zinc, Zn": "zinc",
  "Copper, Cu": "copper",
  "Manganese, Mn": "manganese",
  "Selenium, Se": "selenium",
  "Fluoride, F": "fluoride",
  "Lycopene": "lycopene",
  "Lutein + zeaxanthin": "lutein_zeaxanthin",
  "Tocopherol, beta": "beta_tocopherol",
  "Tocopherol, gamma": "gamma_tocopherol",
  "Tocopherol, delta": "delta_tocopherol",
  "Campesterol": "campesterol",
  "Stigmasterol": "stigmasterol",
  "Phytosterols": "phytosterols",};

// Keys USDA never publishes directly — the pipeline derived them by summing components,
// and cited them as "Derived by summation of USDA FDC #… components: …".
// These two account for 513 of the 564 tier-1 values the raw union would otherwise miss.
export const DERIVED_SUMS: Record<string, readonly string[]> = {
  methionine_cysteine: ["methionine", "cystine"],
  phenylalanine_tyrosine: ["phenylalanine", "tyrosine"],
};

// USDA names whose value is NOT in the gamut's unit and must be converted on the way in.
// Kept separate from USDA_NAME_TO_KEY so a flat lookup can never silently write the wrong
// magnitude — a name here is only usable through the converter.
export const NAME_CONVERSIONS: Record<string, { key: string; factor: number; note: string }> = {
  "Vitamin D (D2 + D3), International Units": {
    key: "vitamin_d",
    factor: 1 / 40, // 1 µg cholecalciferol = 40 IU
    note: "USDA reports vitamin D in both µg and IU; gamut is µg",
  },
};

// When several USDA names map to one gamut key, the FIRST present wins. Order matters where
// the alternatives are not true synonyms.
const NAME_PREFERENCE: Record<string, readonly string[]> = {
  vitamin_d: ["Vitamin D (D2 + D3)", "Vitamin D (D2 + D3), International Units"],
  folate: ["Folate, total"],
  sugars_total: ["Sugars, total including NLEA", "Sugars, Total"],
};

export interface MappedNutrient {
  key: string;
  value_per_100g: number;
  unit: string | null;
  /** the USDA nutrient name this value came from — needed to resolve NAME_PREFERENCE */
  sourceName?: string;
  converted?: { from: string; factor: number; note: string };
  derived?: { from: readonly string[]; formula: string };
}

/**
 * Map one USDA FDC food detail payload to canonical gamut keys.
 * Accepts the `foodNutrients[]` array from /v1/food/{fdcId}. Tries the nutrient NUMBER
 * first (more stable across USDA releases) and falls back to the NAME.
 */
export function mapUsdaFood(foodNutrients: any[]): Record<string, MappedNutrient> {
  const out: Record<string, MappedNutrient> = {};

  for (const fn of foodNutrients ?? []) {
    const n = fn?.nutrient ?? fn;
    const num = String(n?.number ?? n?.nutrientNumber ?? "");
    const name = String(n?.name ?? n?.nutrientName ?? "");
    const amount = fn?.amount ?? fn?.value;
    if (amount == null || Number.isNaN(Number(amount))) continue;

    const conv = NAME_CONVERSIONS[name];
    const key = USDA_NUTRIENT_NUMBER_TO_KEY[num] ?? USDA_NAME_TO_KEY[name] ?? conv?.key;
    if (!key) continue;

    // Where several USDA names feed one key and they are NOT true synonyms, honour the
    // declared preference rather than array order. Without this, `vitamin_d` and `folate`
    // took whichever row USDA happened to list first — a 40x error and a wrong-substance
    // error respectively.
    const pref = NAME_PREFERENCE[key];
    if (key in out) {
      if (!pref) continue;
      const incoming = pref.indexOf(name);
      const existing = pref.indexOf(out[key].sourceName ?? "");
      const better = incoming !== -1 && (existing === -1 || incoming < existing);
      if (!better) continue;
    }

    const value = conv ? Number(amount) * conv.factor : Number(amount);
    out[key] = {
      key,
      value_per_100g: conv ? Number(value.toFixed(6)) : value,
      unit: NUTRIENT_META[key]?.unit ?? null,
      sourceName: name,
      ...(conv ? { converted: { from: name, factor: conv.factor, note: conv.note } } : {}),
    };
  }

  // Derived sums — only when EVERY component is present. A partial sum would silently
  // understate the value, which is worse than omitting it.
  for (const [key, parts] of Object.entries(DERIVED_SUMS)) {
    if (key in out) continue;
    if (!parts.every((p) => p in out)) continue;
    const total = parts.reduce((a, p) => a + out[p].value_per_100g, 0);
    out[key] = {
      key,
      value_per_100g: Number(total.toFixed(4)),
      unit: NUTRIENT_META[key]?.unit ?? null,
      derived: {
        from: parts,
        formula: parts.map((p) => `${p} ${out[p].value_per_100g}`).join(" + "),
      },
    };
  }

  return out;
}

/** Every gamut key this module can reach. Used by the coverage test. */
export function reachableKeys(): Set<string> {
  return new Set([
    ...Object.values(USDA_NUTRIENT_NUMBER_TO_KEY),
    ...Object.values(USDA_NAME_TO_KEY),
    ...Object.values(NAME_CONVERSIONS).map((c) => c.key),
    ...Object.keys(DERIVED_SUMS),
  ]);
}

/**
 * Every key this module can emit MUST exist in the gamut. A key that doesn't gets
 * `NUTRIENT_META[key] === undefined`, so mapUsdaFood emits `unit: null` and reconcile.ts
 * silently falls back to "g" — turning a µg or mg nutrient into a 10^3–10^6 error that no
 * range check would flag as suspicious. Taurine slipped through exactly this way.
 * Throws at import time rather than letting a bad key reach the database.
 */
function assertKeysInGamut(): void {
  // Array.from rather than spreading the Set: the project's tsconfig target
  // predates downlevel iteration, so spreading an iterable fails the build.
  const orphans = Array.from(reachableKeys()).filter((k) => !NUTRIENT_META[k]);
  if (orphans.length) {
    throw new Error(
      `usda-gamut-map: ${orphans.length} mapping target(s) absent from gamut.ts — ` +
        `${orphans.join(", ")}. Add them to gamut.ts or remove the mapping; an unlisted ` +
        `key is emitted with unit null and resolves to "g" downstream.`
    );
  }
}
assertKeysInGamut();
