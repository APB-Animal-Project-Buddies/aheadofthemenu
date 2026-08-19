// The full nutrient gamut — the 92 nutrient_keys the FoodLP/USDA export tracks — with the
// label, unit, and group for each. This is the canonical field list: every nutrition record
// (USDA or OFF) stores a subset of these keys, all per-100g, in these units.
//
// Units follow USDA's per-nutrient convention: energy kcal; macros/amino acids/fatty acids
// grams; most minerals mg; trace minerals, carotenoids, and µg-vitamins in micrograms.
import type { NutrientKey } from "./nutrients";

export type NutrientGroup =
  | "macro" | "sugar" | "fat" | "amino_acid" | "mineral" | "trace_mineral"
  | "vitamin" | "carotenoid" | "sterol";

export type NutrientUnit = "kcal" | "g" | "mg" | "µg";

export interface NutrientMeta {
  label: string;
  unit: NutrientUnit;
  group: NutrientGroup;
}

// key -> metadata. Order within groups is roughly label-panel order.
export const NUTRIENT_META: Record<NutrientKey | string, NutrientMeta> = {
  // --- macronutrients & proximates ---
  energy: { label: "Energy", unit: "kcal", group: "macro" },
  protein: { label: "Protein", unit: "g", group: "macro" },
  total_fat: { label: "Total fat", unit: "g", group: "macro" },
  carbohydrate: { label: "Carbohydrate, by difference", unit: "g", group: "macro" },
  fiber_total: { label: "Fiber, total dietary", unit: "g", group: "macro" },
  fiber_soluble: { label: "Fiber, soluble", unit: "g", group: "macro" },
  fiber_insoluble: { label: "Fiber, insoluble", unit: "g", group: "macro" },
  sugars_total: { label: "Sugars, total", unit: "g", group: "macro" },
  starch: { label: "Starch", unit: "g", group: "macro" },
  water: { label: "Water", unit: "g", group: "macro" },
  ash: { label: "Ash", unit: "g", group: "macro" },

  // --- individual sugars ---
  fructose: { label: "Fructose", unit: "g", group: "sugar" },
  glucose: { label: "Glucose", unit: "g", group: "sugar" },
  sucrose: { label: "Sucrose", unit: "g", group: "sugar" },
  maltose: { label: "Maltose", unit: "g", group: "sugar" },
  galactose: { label: "Galactose", unit: "g", group: "sugar" },

  // --- fats & fatty acids ---
  saturated_fat: { label: "Saturated fat", unit: "g", group: "fat" },
  monounsaturated_fat: { label: "Monounsaturated fat", unit: "g", group: "fat" },
  polyunsaturated_fat: { label: "Polyunsaturated fat", unit: "g", group: "fat" },
  trans_fat: { label: "Trans fat", unit: "g", group: "fat" },
  la: { label: "Linoleic acid (18:2 n-6)", unit: "g", group: "fat" },
  ala: { label: "α-Linolenic acid (18:3 n-3)", unit: "g", group: "fat" },
  epa: { label: "EPA (20:5 n-3)", unit: "g", group: "fat" },
  dha: { label: "DHA (22:6 n-3)", unit: "g", group: "fat" },
  aa: { label: "Arachidonic acid (20:4)", unit: "g", group: "fat" },
  cholesterol: { label: "Cholesterol", unit: "mg", group: "fat" },

  // --- amino acids ---
  tryptophan: { label: "Tryptophan", unit: "g", group: "amino_acid" },
  threonine: { label: "Threonine", unit: "g", group: "amino_acid" },
  isoleucine: { label: "Isoleucine", unit: "g", group: "amino_acid" },
  leucine: { label: "Leucine", unit: "g", group: "amino_acid" },
  lysine: { label: "Lysine", unit: "g", group: "amino_acid" },
  methionine: { label: "Methionine", unit: "g", group: "amino_acid" },
  methionine_cysteine: { label: "Methionine + Cysteine (SAA)", unit: "g", group: "amino_acid" },
  cysteine: { label: "Cysteine", unit: "g", group: "amino_acid" },
  cystine: { label: "Cystine", unit: "g", group: "amino_acid" },
  phenylalanine: { label: "Phenylalanine", unit: "g", group: "amino_acid" },
  phenylalanine_tyrosine: { label: "Phenylalanine + Tyrosine (AAA)", unit: "g", group: "amino_acid" },
  tyrosine: { label: "Tyrosine", unit: "g", group: "amino_acid" },
  valine: { label: "Valine", unit: "g", group: "amino_acid" },
  arginine: { label: "Arginine", unit: "g", group: "amino_acid" },
  histidine: { label: "Histidine", unit: "g", group: "amino_acid" },
  alanine: { label: "Alanine", unit: "g", group: "amino_acid" },
  aspartic_acid: { label: "Aspartic acid", unit: "g", group: "amino_acid" },
  glutamic_acid: { label: "Glutamic acid", unit: "g", group: "amino_acid" },
  glycine: { label: "Glycine", unit: "g", group: "amino_acid" },
  proline: { label: "Proline", unit: "g", group: "amino_acid" },
  serine: { label: "Serine", unit: "g", group: "amino_acid" },

  // --- major minerals ---
  calcium: { label: "Calcium", unit: "mg", group: "mineral" },
  iron: { label: "Iron", unit: "mg", group: "mineral" },
  magnesium: { label: "Magnesium", unit: "mg", group: "mineral" },
  phosphorus: { label: "Phosphorus", unit: "mg", group: "mineral" },
  potassium: { label: "Potassium", unit: "mg", group: "mineral" },
  sodium: { label: "Sodium", unit: "mg", group: "mineral" },
  zinc: { label: "Zinc", unit: "mg", group: "mineral" },
  copper: { label: "Copper", unit: "mg", group: "mineral" },
  manganese: { label: "Manganese", unit: "mg", group: "mineral" },
  chloride: { label: "Chloride", unit: "mg", group: "mineral" },
  sulfur: { label: "Sulfur", unit: "mg", group: "mineral" },

  // --- trace minerals ---
  selenium: { label: "Selenium", unit: "µg", group: "trace_mineral" },
  iodine: { label: "Iodine", unit: "µg", group: "trace_mineral" },
  molybdenum: { label: "Molybdenum", unit: "µg", group: "trace_mineral" },
  fluoride: { label: "Fluoride", unit: "µg", group: "trace_mineral" },
  // Added to close a gap against the seed-research flowchart, whose RDA-CONSTRAINED list
  // includes chromium while this gamut did not. A key absent here gets `NUTRIENT_META[key]
  // === undefined`, and reconcile.ts:114 then silently falls back to unit "g" — so an
  // unlisted trace mineral is not merely missing, it is mislabelled by 10^6.
  chromium: { label: "Chromium", unit: "µg", group: "trace_mineral" },

  // ── ANIMAL-ORIGIN BIOMARKERS ────────────────────────────────────────────────────────
  // Added because the research flowchart REASONED FROM THESE AND THEN DISCARDED THEM. On
  // `Candies, carob, unsweetened` it established dairy content from naturally-occurring
  // B-12, cholesterol, and the short-chain milk-fat acids — then stored only the prose
  // conclusion, because none of the supporting values had a slot. A reviewer could not
  // verify the claim from the row.
  //
  // These three make the animal-origin test checkable from stored data:
  //   vitamin_b12_added  USDA reports "Vitamin B-12, added" SEPARATELY from total B-12.
  //                      total > 0 with added == 0 means NATURALLY OCCURRING B-12, which
  //                      plants do not synthesise. Without this field the fortification
  //                      objection to a B-12 test cannot be settled from the data.
  //   butyric_acid 4:0   ~3-4% of ruminant milk fat, near-absent elsewhere.
  //   caproic_acid 6:0   likewise a milk-fat marker.
  vitamin_b12_added: { label: "Vitamin B-12, added", unit: "µg", group: "vitamin" },
  butyric_acid: { label: "Butyric acid 4:0", unit: "g", group: "fat" },
  caproic_acid: { label: "Caproic acid 6:0", unit: "g", group: "fat" },
  cobalt: { label: "Cobalt", unit: "µg", group: "trace_mineral" },
  nickel: { label: "Nickel", unit: "µg", group: "trace_mineral" },
  boron: { label: "Boron", unit: "mg", group: "trace_mineral" },

  // --- vitamins ---
  vitamin_a_rae: { label: "Vitamin A, RAE", unit: "µg", group: "vitamin" },
  retinol: { label: "Retinol", unit: "µg", group: "vitamin" },
  vitamin_c: { label: "Vitamin C", unit: "mg", group: "vitamin" },
  vitamin_d: { label: "Vitamin D (D2 + D3)", unit: "µg", group: "vitamin" },
  vitamin_e: { label: "Vitamin E (α-tocopherol)", unit: "mg", group: "vitamin" },
  beta_tocopherol: { label: "Tocopherol, beta", unit: "mg", group: "vitamin" },
  gamma_tocopherol: { label: "Tocopherol, gamma", unit: "mg", group: "vitamin" },
  delta_tocopherol: { label: "Tocopherol, delta", unit: "mg", group: "vitamin" },
  vitamin_k: { label: "Vitamin K", unit: "µg", group: "vitamin" },
  thiamin: { label: "Thiamin (B1)", unit: "mg", group: "vitamin" },
  riboflavin: { label: "Riboflavin (B2)", unit: "mg", group: "vitamin" },
  niacin: { label: "Niacin (B3)", unit: "mg", group: "vitamin" },
  pantothenic_acid: { label: "Pantothenic acid (B5)", unit: "mg", group: "vitamin" },
  vitamin_b6: { label: "Vitamin B6", unit: "mg", group: "vitamin" },
  folate: { label: "Folate, total", unit: "µg", group: "vitamin" },
  vitamin_b12: { label: "Vitamin B12", unit: "µg", group: "vitamin" },
  biotin: { label: "Biotin (B7)", unit: "µg", group: "vitamin" },
  choline: { label: "Choline, total", unit: "mg", group: "vitamin" },
  betaine: { label: "Betaine", unit: "mg", group: "vitamin" },

  // --- carotenoids ---
  alpha_carotene: { label: "Carotene, alpha", unit: "µg", group: "carotenoid" },
  beta_carotene: { label: "Carotene, beta", unit: "µg", group: "carotenoid" },
  beta_cryptoxanthin: { label: "Cryptoxanthin, beta", unit: "µg", group: "carotenoid" },
  lutein_zeaxanthin: { label: "Lutein + zeaxanthin", unit: "µg", group: "carotenoid" },
  lycopene: { label: "Lycopene", unit: "µg", group: "carotenoid" },

  // --- sterols ---
  phytosterols: { label: "Phytosterols, total", unit: "mg", group: "sterol" },
  beta_sitosterol: { label: "Beta-sitosterol", unit: "mg", group: "sterol" },
  campesterol: { label: "Campesterol", unit: "mg", group: "sterol" },
  stigmasterol: { label: "Stigmasterol", unit: "mg", group: "sterol" },
};

export const ALL_NUTRIENT_KEYS = Object.keys(NUTRIENT_META);

// Fields we consider the minimum viable panel for a usable nutrition record.
export const CORE_NUTRIENT_KEYS: NutrientKey[] = [
  "energy", "protein", "total_fat", "saturated_fat", "carbohydrate",
  "sugars_total", "fiber_total", "sodium",
];
