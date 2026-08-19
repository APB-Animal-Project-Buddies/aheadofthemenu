// USDA FoodData Central provider. Generic whole-food nutrition — the best source for
// generic ingredients ("chickpea", "spinach"). Requires USDA_API_KEY (falls back to the
// public DEMO_KEY, which is heavily rate-limited — fine for a quick try, not for bulk work).
import { USDA_NUTRIENT_NUMBER_TO_KEY, round2, type NutrientKey } from "./nutrients";
import { fetchRetry } from "./http";
import type { NutritionHit } from "./types";

const BASE = "https://api.nal.usda.gov/fdc/v1";

// Generic reference foods live in these datatypes; Branded is noisy and often lacks
// full nutrient panels, so it's opt-in.
export const DEFAULT_DATA_TYPES = ["Foundation", "SR Legacy"] as const;

function apiKey(): string {
  const k = process.env.USDA_API_KEY;
  if (!k) console.warn("[nutrition/usda] USDA_API_KEY not set — using DEMO_KEY (rate-limited).");
  return k || "DEMO_KEY";
}

function toHit(food: any): NutritionHit {
  const nutrients: Partial<Record<NutrientKey, number>> = {};
  let energyFallback: number | undefined;
  for (const n of food.foodNutrients ?? []) {
    // /foods/search flattens this to nutrientNumber+value; /food/{id} nests it under
    // `nutrient` and calls the value `amount`. Accept either shape.
    const number = n.nutrientNumber ?? n.nutrient?.number;
    const value = typeof n.value === "number" ? n.value : n.amount;
    const key = USDA_NUTRIENT_NUMBER_TO_KEY[String(number)];
    if (key && typeof value === "number" && Number.isFinite(value)) nutrients[key] = round2(value);
    // Newer Foundation foods drop the classic Energy (208) row and report only the Atwater
    // variants; take the general factor as a fallback so those foods still get an energy value.
    else if (String(number) === "957" && typeof value === "number" && Number.isFinite(value)) energyFallback = round2(value);
  }
  if (nutrients.energy == null && energyFallback != null) nutrients.energy = energyFallback;
  return {
    source: "usda",
    sourceId: String(food.fdcId),
    name: food.description ?? String(food.fdcId),
    detail: [food.dataType, food.foodCategory].filter(Boolean).join(" · ") || undefined,
    score: typeof food.score === "number" ? food.score : undefined,
    citation: `USDA FoodData Central — FDC #${food.fdcId}${food.dataType ? ` (${food.dataType})` : ""}`,
    url: `https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients`,
    nutrients,
  };
}

export async function searchUsda(
  query: string,
  opts: { pageSize?: number; dataType?: readonly string[] } = {}
): Promise<NutritionHit[]> {
  const { pageSize = 5, dataType = DEFAULT_DATA_TYPES } = opts;
  const url = new URL(`${BASE}/foods/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("dataType", dataType.join(","));
  url.searchParams.set("api_key", apiKey());

  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`USDA FDC ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { foods?: any[] };
  return (data.foods ?? []).map(toHit);
}

// Full nutrient panel for one food (search sometimes returns an abbreviated set).
export async function fetchUsdaFood(fdcId: string | number): Promise<NutritionHit> {
  const url = new URL(`${BASE}/food/${fdcId}`);
  url.searchParams.set("api_key", apiKey());
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`USDA FDC ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return toHit(await res.json());
}
