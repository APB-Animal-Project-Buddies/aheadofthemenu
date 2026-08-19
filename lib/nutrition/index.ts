// Unified nutrition search across USDA (generic foods) and OpenFoodFacts (branded
// products). Both providers normalize to the same canonical per-100g nutrient keys, so a
// hit from either source drops straight into `usda_food_nutrients`-shaped storage.
import { searchUsda } from "./usda";
import { searchOff } from "./off";
import type { NutritionSource, SearchOptions, SearchResult } from "./types";

export * from "./types";
export { searchUsda, fetchUsdaFood } from "./usda";
export { searchOff } from "./off";
export type { NutrientKey } from "./nutrients";
export { NUTRIENT_META, ALL_NUTRIENT_KEYS, CORE_NUTRIENT_KEYS } from "./gamut";
export type { NutrientGroup, NutrientUnit, NutrientMeta } from "./gamut";
export { reconcileHits } from "./reconcile";
export type { NutritionRecord, ReconciledNutrient, Agreement } from "./reconcile";

export async function searchNutrition(query: string, opts: SearchOptions = {}): Promise<SearchResult> {
  const { source = "both", pageSize = 5 } = opts;
  const errors: SearchResult["errors"] = [];

  const run = async (src: NutritionSource, fn: () => Promise<SearchResult["hits"]>) => {
    try {
      return await fn();
    } catch (e) {
      errors.push({ source: src, message: e instanceof Error ? e.message : String(e) });
      return [];
    }
  };

  const tasks: Array<Promise<SearchResult["hits"]>> = [];
  if (source === "usda" || source === "both") tasks.push(run("usda", () => searchUsda(query, { pageSize })));
  if (source === "off" || source === "both") tasks.push(run("off", () => searchOff(query, { pageSize })));

  const hits = (await Promise.all(tasks)).flat();
  return { query, hits, errors };
}
