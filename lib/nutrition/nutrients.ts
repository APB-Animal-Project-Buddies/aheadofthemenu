// Canonical nutrient vocabulary — matches `usda_food_nutrients.nutrient_key` from the
// FoodLP export, so search results from USDA *and* OpenFoodFacts normalize to the SAME
// keys and slot straight into our nutrition tables.
//
// Units follow the USDA/export convention: energy in kcal, macros & water/ash in grams,
// minerals in mg (except selenium/µg-scale ones), vitamins in their USDA unit. OFF values
// that arrive in different units (salt/sodium in g, energy in kJ) are converted on the way in.

export type NutrientKey =
  | "energy" | "protein" | "total_fat" | "carbohydrate" | "sugars_total" | "fiber_total"
  | "water" | "ash" | "saturated_fat" | "monounsaturated_fat" | "polyunsaturated_fat" | "trans_fat"
  | "calcium" | "iron" | "magnesium" | "phosphorus" | "potassium" | "sodium" | "zinc"
  | "copper" | "manganese" | "selenium"
  | "vitamin_c" | "thiamin" | "riboflavin" | "niacin" | "pantothenic_acid" | "vitamin_b6"
  | "folate" | "vitamin_b12" | "vitamin_a_rae" | "vitamin_e" | "vitamin_k" | "vitamin_d"
  | "retinol" | "choline" | "cholesterol";

// USDA FoodData Central `nutrientNumber` (INFOODS/SR number, as a string) -> our key.
export const USDA_NUTRIENT_NUMBER_TO_KEY: Record<string, NutrientKey> = {
  "208": "energy", "203": "protein", "204": "total_fat", "205": "carbohydrate",
  "269": "sugars_total", "291": "fiber_total", "255": "water", "207": "ash",
  "606": "saturated_fat", "645": "monounsaturated_fat", "646": "polyunsaturated_fat", "605": "trans_fat",
  "301": "calcium", "303": "iron", "304": "magnesium", "305": "phosphorus",
  "306": "potassium", "307": "sodium", "309": "zinc", "312": "copper",
  "315": "manganese", "317": "selenium",
  "401": "vitamin_c", "404": "thiamin", "405": "riboflavin", "406": "niacin",
  "410": "pantothenic_acid", "415": "vitamin_b6", "417": "folate", "418": "vitamin_b12",
  "320": "vitamin_a_rae", "323": "vitamin_e", "430": "vitamin_k", "328": "vitamin_d",
  "319": "retinol", "421": "choline", "601": "cholesterol",
};

// OpenFoodFacts `nutriments` field -> our key, with a unit converter to reach the USDA
// convention. OFF reports per-100g fields suffixed `_100g`; energy in kcal via `energy-kcal_100g`.
type OffField = { key: NutrientKey; convert?: (v: number) => number };
const G_TO_MG = (v: number) => v * 1000;
export const OFF_FIELD_TO_KEY: Record<string, OffField> = {
  "energy-kcal_100g": { key: "energy" },
  "proteins_100g": { key: "protein" },
  "fat_100g": { key: "total_fat" },
  "carbohydrates_100g": { key: "carbohydrate" },
  "sugars_100g": { key: "sugars_total" },
  "fiber_100g": { key: "fiber_total" },
  "saturated-fat_100g": { key: "saturated_fat" },
  "monounsaturated-fat_100g": { key: "monounsaturated_fat" },
  "polyunsaturated-fat_100g": { key: "polyunsaturated_fat" },
  "trans-fat_100g": { key: "trans_fat" },
  "sodium_100g": { key: "sodium", convert: G_TO_MG }, // OFF sodium is grams -> mg
  "calcium_100g": { key: "calcium", convert: G_TO_MG },
  "iron_100g": { key: "iron", convert: G_TO_MG },
  "potassium_100g": { key: "potassium", convert: G_TO_MG },
  "magnesium_100g": { key: "magnesium", convert: G_TO_MG },
  "zinc_100g": { key: "zinc", convert: G_TO_MG },
  "vitamin-c_100g": { key: "vitamin_c", convert: G_TO_MG },
  "cholesterol_100g": { key: "cholesterol", convert: G_TO_MG },
};

// Round a per-100g nutrient value to 2 decimals (kills float32 noise from OFF and keeps
// values tidy for storage/display).
export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function offNutrimentsToKeys(nutriments: Record<string, unknown>): Partial<Record<NutrientKey, number>> {
  const out: Partial<Record<NutrientKey, number>> = {};
  for (const [field, spec] of Object.entries(OFF_FIELD_TO_KEY)) {
    const raw = nutriments?.[field];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      out[spec.key] = round2(spec.convert ? spec.convert(raw) : raw);
    }
  }
  return out;
}
