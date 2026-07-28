/**
 * Add a single dish — Chef Alexis Gauthier's "Green Asparagus Hollandaise" (vegan) —
 * to the dishes table.
 *
 * Source (backlinked, method NOT reproduced — externally attributed):
 *   https://chefalexisgauthier.substack.com/p/vegan-hollandaise
 *
 * Per request: ingredients + details only. Steps are intentionally omitted; we link to the
 * source (`resourceLink`) and credit the creator (`originalCreator`) instead of copying the
 * method verbatim. Pricing/substitutions are not included.
 *
 * Usage:
 *   bun scripts/add-vegan-hollandaise-dish.ts             # dry-run (default): build + print dish_data, NO DB
 *   bun scripts/add-vegan-hollandaise-dish.ts --execute   # idempotent insert (matched by dish_name)
 *
 * Format: built through lib/dishes.buildDishData, so the output is exactly the current
 * dish_data schema. Idempotency (--execute only): matched by dish_name before insert; re-runs
 * are no-ops and print `exists` vs `created`.
 */

import { buildDishData } from "../lib/dishes";
import { runSeed, seedModeFromArgv } from "./seed-dish";

const input = {
  title: "Green Asparagus Hollandaise",
  description:
    "Chef Alexis Gauthier's plant-based take on the classic French sauce — \"who needs egg " +
    "yolk & butter?\" A silken-tofu base is emulsified with clarified vegan butter, white miso, " +
    "turmeric and kala namak (for the eggy note), sharpened with a white-wine-vinegar shallot " +
    "reduction and lemon, then spooned over tender green asparagus.",
  cuisines: ["french"],
  dishType: ["appetizer", "sauce"],
  tags: ["fancy"],
  allergens: ["soy"],
  originalCreator: "Alexis Gauthier",
  resourceLink: "https://chefalexisgauthier.substack.com/p/vegan-hollandaise",
  ingredients: [
    { name: "silken tofu", quantity: 150, unit: "g", note: "as wet as possible" },
    { name: "extra virgin olive oil", quantity: 2, unit: "tbsp" },
    { name: "white miso", quantity: 1, unit: "tbsp" },
    { name: "ground turmeric", quantity: "1/4", unit: "tsp" },
    { name: "kala namak (black salt)", quantity: "1/2", unit: "tsp" },
    { name: "shallot", quantity: 1, unit: "", note: "small, finely sliced" },
    { name: "white wine vinegar", quantity: 50, unit: "ml" },
    { name: "fresh lemon juice", quantity: 1, unit: "tbsp" },
    { name: "clarified vegan butter", quantity: 100, unit: "g", note: "warm" },
    { name: "sea salt and freshly ground white pepper", quantity: "", unit: "to_taste" },
    { name: "green asparagus", quantity: 2, unit: "bunch" },
    { name: "lemon", quantity: 1, unit: "", note: "large" },
  ],
  // steps intentionally omitted — externally attributed, we backlink instead
};

const dishData = buildDishData(input);
await runSeed(dishData.title as string, dishData, seedModeFromArgv(process.argv.slice(2)));
