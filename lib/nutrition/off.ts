// OpenFoodFacts provider via the Search-a-licious API (search.openfoodfacts.org). No API
// key required for read/search — OFF just asks for an identifying User-Agent. Returns
// BRANDED products, so this is the better source for our branded-product ingredients;
// for generic ingredients prefer USDA.
import { offNutrimentsToKeys } from "./nutrients";
import { fetchRetry } from "./http";
import type { NutritionHit } from "./types";

const BASE = "https://search.openfoodfacts.org";
const FIELDS = ["code", "product_name", "brands", "nutriments"];
// OFF etiquette: identify the app + a contact so they can reach us about heavy usage.
const USER_AGENT = "aheadofthemenu-nutrition/0.1 (vishnuamritpydah@gmail.com)";

export async function searchOff(
  query: string,
  opts: { pageSize?: number; tries?: number; timeoutMs?: number } = {}
): Promise<NutritionHit[]> {
  const { pageSize = 5, tries = 4, timeoutMs } = opts;
  const url = new URL(`${BASE}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("fields", FIELDS.join(","));
  url.searchParams.set("page_size", String(pageSize));

  const res = await fetchRetry(url, { headers: { Accept: "application/json", "User-Agent": USER_AGENT } }, { tries, timeoutMs });
  if (!res.ok) throw new Error(`OFF search ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { hits?: any[] };
  return (data.hits ?? []).map((h) => {
    const code = String(h.code ?? "");
    return {
      source: "off" as const,
      sourceId: code,
      name: h.product_name || code || "unknown",
      detail: h.brands || undefined,
      citation: `OpenFoodFacts — product ${code}${h.brands ? ` (${h.brands})` : ""}`,
      url: code ? `https://world.openfoodfacts.org/product/${code}` : undefined,
      nutrients: offNutrimentsToKeys(h.nutriments ?? {}),
    };
  });
}
