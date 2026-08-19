import type { NutrientKey } from "./nutrients";

export type NutritionSource = "usda" | "off";

// A single normalized candidate for an ingredient's nutrition. `nutrients` is per-100g,
// keyed by our canonical NutrientKey regardless of which source it came from.
export interface NutritionHit {
  source: NutritionSource;
  sourceId: string; // USDA fdcId (as string) or OFF barcode
  name: string;
  detail?: string; // USDA dataType/category, or OFF brand
  score?: number; // provider relevance score, if any
  citation: string; // human-readable provenance, e.g. "USDA FoodData Central — FDC #172469 (SR Legacy)"
  url?: string; // canonical page for this food/product
  nutrients: Partial<Record<NutrientKey, number>>;
}

export interface SearchOptions {
  source?: NutritionSource | "both";
  pageSize?: number;
}

export interface SearchResult {
  query: string;
  hits: NutritionHit[];
  errors: Array<{ source: NutritionSource; message: string }>;
}
