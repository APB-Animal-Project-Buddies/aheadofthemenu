/**
 * Add a single dish — Richard Makin's (School Night Vegan) "Vegan Trifle" — to
 * the dishes table.
 *
 * Source (backlinked, method NOT reproduced — externally attributed):
 *   https://schoolnightvegan.com/home/vegan-trifle/
 *
 * Per the house convention (see add-vegan-hollandaise-dish.ts): ingredients +
 * details only. Steps are intentionally omitted; we link to the source
 * (`resourceLink`) and credit the creator (`originalCreator`) instead of copying
 * the method verbatim.
 *
 * The seed is the SOURCE OF TRUTH — see scripts/seed-dish.ts. Usage:
 *   bun scripts/add-vegan-trifle-dish.ts             # dry-run: build + print dish_data, NO DB
 *   bun scripts/add-vegan-trifle-dish.ts --check     # compare against the live dish, report drift
 *   bun scripts/add-vegan-trifle-dish.ts --execute   # create, or reconcile the live dish to match (seed wins)
 */

import { buildDishData } from "../lib/dishes";
import { runSeed, seedModeFromArgv } from "./seed-dish";

const input = {
  title: "Vegan Trifle",
  description:
    "A layered plant-based celebration dessert: moist vanilla sponge, tangy raspberry compote, " +
    "vanilla custard and vegan whipped cream, finished with fresh raspberries, toasted almonds and mint.",
  cuisines: ["other"],
  dishType: ["dessert"],
  tags: ["fancy"],
  difficulty: 3,
  allergens: ["gluten", "soy", "nuts"],
  servings: 12,
  originalCreator: "School Night Vegan",
  resourceLink: "https://schoolnightvegan.com/home/vegan-trifle/",
  // Reception of the linked source recipe.
  validation: { rating: 4.97, ratingScale: 5, reviewCount: 28 },
  ingredients: [
    // ── Sponge ───────────────────────────────────────────────────────────
    { name: "soy milk", quantity: 90, unit: "ml", section: "Sponge", note: "unsweetened, unflavoured, room temperature" },
    { name: "soft silken tofu", quantity: 180, unit: "g", section: "Sponge", note: "room temperature" },
    { name: "vanilla extract", quantity: 2, unit: "tsp", section: "Sponge" },
    { name: "plain white flour", quantity: 225, unit: "g", section: "Sponge" },
    { name: "corn starch", quantity: 1.5, unit: "tbsp", section: "Sponge" },
    { name: "baking powder", quantity: 1.5, unit: "tsp", section: "Sponge" },
    { name: "fine sea salt", quantity: "1/2", unit: "tsp", section: "Sponge" },
    { name: "caster sugar", quantity: 225, unit: "g", section: "Sponge" },
    { name: "vegan butter", quantity: 135, unit: "g", section: "Sponge", note: "room temperature, plus 1 tbsp extra melted" },
    // ── Raspberry compote ───────────────────────────────────────────────
    { name: "frozen raspberries", quantity: 400, unit: "g", section: "Raspberry compote" },
    { name: "sugar", quantity: 125, unit: "g", section: "Raspberry compote" },
    { name: "lemon juice", quantity: 1, unit: "tbsp", section: "Raspberry compote" },
    // ── Custard ─────────────────────────────────────────────────────────
    { name: "cornstarch", quantity: 2.5, unit: "tbsp", section: "Custard" },
    { name: "soy milk", quantity: 450, unit: "ml", section: "Custard", note: "unsweetened, unflavoured" },
    { name: "vanilla extract", quantity: 3, unit: "tsp", section: "Custard", note: "or vanilla bean paste" },
    { name: "caster sugar", quantity: 50, unit: "g", section: "Custard" },
    { name: "vegan butter", quantity: 50, unit: "g", section: "Custard" },
    // ── Whipped cream ───────────────────────────────────────────────────
    { name: "vegan whipping cream", quantity: 500, unit: "ml", section: "Whipped cream" },
    { name: "sugar", quantity: 2, unit: "tbsp", section: "Whipped cream" },
    { name: "vanilla extract", quantity: 1, unit: "tsp", section: "Whipped cream" },
    // ── To serve ────────────────────────────────────────────────────────
    { name: "fresh raspberries", quantity: 100, unit: "g", section: "To serve" },
    { name: "flaked toasted almonds", quantity: 3, unit: "tbsp", section: "To serve" },
    { name: "fresh mint", quantity: "", unit: "sprig", section: "To serve", note: "a few sprigs" },
  ],
  // steps intentionally omitted — externally attributed, we backlink instead
};

const dishData = buildDishData(input);
await runSeed(dishData.title as string, dishData, seedModeFromArgv(process.argv.slice(2)));
