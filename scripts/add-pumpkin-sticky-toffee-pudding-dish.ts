/**
 * Add a single dish — Richard Makin's (School Night Vegan) "Vegan Pumpkin Sticky
 * Toffee Pudding" — to the dishes table.
 *
 * Source (backlinked, method NOT reproduced — externally attributed):
 *   https://schoolnightvegan.com/home/vegan-pumpkin-sticky-toffee-pudding/
 *
 * Per the house convention (see add-vegan-hollandaise-dish.ts): ingredients +
 * details only. Steps are intentionally omitted; we link to the source
 * (`resourceLink`) and credit the creator (`originalCreator`) instead of copying
 * the method verbatim.
 *
 * Usage:
 *   bun scripts/add-pumpkin-sticky-toffee-pudding-dish.ts             # dry-run (default): build + print dish_data, NO DB
 *   bun scripts/add-pumpkin-sticky-toffee-pudding-dish.ts --execute   # idempotent insert (matched by dish_name)
 */

import { buildDishData } from "../lib/dishes";
import { runSeed, seedModeFromArgv } from "./seed-dish";

const input = {
  title: "Vegan Pumpkin Sticky Toffee Pudding",
  description:
    "A cosy autumnal dessert: a moist pumpkin sponge warm with pumpkin spice, drenched in a " +
    "luscious pumpkin toffee sauce. Freezable and make-ahead — ideal for holiday gatherings.",
  cuisines: ["other"],
  dishType: ["dessert"],
  tags: ["comfort-food"],
  difficulty: 2,
  allergens: ["gluten"],
  servings: 9,
  prepTime: "20 min",
  cookTime: "30 min",
  originalCreator: "School Night Vegan",
  resourceLink: "https://schoolnightvegan.com/home/vegan-pumpkin-sticky-toffee-pudding/",
  // Reception of the linked source recipe.
  validation: { rating: 5, ratingScale: 5, reviewCount: 1 },
  ingredients: [
    // ── Pudding ──────────────────────────────────────────────────────────
    { name: "pitted dates", quantity: 100, unit: "g", section: "Pudding", note: "roughly chopped; medjool recommended" },
    { name: "baking soda", quantity: 1, unit: "tsp", section: "Pudding" },
    { name: "boiling water", quantity: 180, unit: "ml", section: "Pudding" },
    { name: "plain white flour", quantity: 170, unit: "g", section: "Pudding" },
    { name: "baking powder", quantity: 2, unit: "tsp", section: "Pudding" },
    { name: "pumpkin spice", quantity: 3, unit: "tsp", section: "Pudding" },
    { name: "fine sea salt", quantity: "", unit: "pinch", section: "Pudding" },
    { name: "canned pumpkin purée", quantity: 100, unit: "g", section: "Pudding" },
    { name: "vegetable oil", quantity: 80, unit: "ml", section: "Pudding" },
    { name: "plant milk", quantity: 60, unit: "ml", section: "Pudding", note: "unsweetened & unflavoured" },
    { name: "dark brown sugar", quantity: 80, unit: "g", section: "Pudding" },
    { name: "treacle or blackstrap molasses", quantity: 40, unit: "g", section: "Pudding" },
    // ── Pumpkin toffee sauce ────────────────────────────────────────────
    { name: "vegan butter", quantity: 150, unit: "g", section: "Pumpkin toffee sauce" },
    { name: "light brown sugar", quantity: 150, unit: "g", section: "Pumpkin toffee sauce" },
    { name: "treacle or blackstrap molasses", quantity: 1, unit: "tbsp", section: "Pumpkin toffee sauce" },
    { name: "vanilla extract", quantity: 1, unit: "tsp", section: "Pumpkin toffee sauce" },
    { name: "flaky sea salt", quantity: "1/4", unit: "tsp", section: "Pumpkin toffee sauce" },
    { name: "pumpkin purée", quantity: 3, unit: "tbsp", section: "Pumpkin toffee sauce" },
    { name: "vegan double cream", quantity: 150, unit: "g", section: "Pumpkin toffee sauce" },
  ],
  // steps intentionally omitted — externally attributed, we backlink instead
};

const dishData = buildDishData(input);
await runSeed(dishData.title as string, dishData, seedModeFromArgv(process.argv.slice(2)));
