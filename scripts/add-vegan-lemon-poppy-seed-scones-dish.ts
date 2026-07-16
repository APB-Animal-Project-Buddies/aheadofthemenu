/**
 * Add a single dish — Richard Makin's (School Night Vegan) "Vegan Lemon Poppy
 * Seed Scones" — to the dishes table.
 *
 * Source (backlinked, method NOT reproduced — externally attributed):
 *   https://schoolnightvegan.com/home/vegan-lemon-poppy-seed-scones/
 *
 * Per the house convention (see add-vegan-trifle-dish.ts): ingredients + details
 * only. Steps are intentionally omitted; we link to the source (`resourceLink`)
 * and credit the creator (`originalCreator`) instead of copying the method.
 *
 * NOTE: contains gluten (wheat flour) — NOT gluten-free. Nut-free.
 *
 * The seed is the SOURCE OF TRUTH — see scripts/seed-dish.ts. Usage:
 *   bun scripts/add-vegan-lemon-poppy-seed-scones-dish.ts             # dry-run: build + print, NO DB
 *   bun scripts/add-vegan-lemon-poppy-seed-scones-dish.ts --check     # compare against the live dish
 *   bun scripts/add-vegan-lemon-poppy-seed-scones-dish.ts --execute   # create / reconcile (seed wins)
 */

import { buildDishData } from "../lib/dishes";
import { runSeed, seedModeFromArgv } from "./seed-dish";

const input = {
  title: "Vegan Lemon Poppy Seed Scones",
  description:
    "Zesty vegan lemon poppy seed scones with a buttery, flaky crumb and a sweet lemon glaze.",
  cuisines: ["other"],
  dishType: ["breakfast"],
  tags: ["nut-free"],
  difficulty: 2,
  allergens: ["gluten"], // wheat flour — NOT gluten-free
  servings: 6,
  prepTime: 10,
  cookTime: 25,
  originalCreator: "School Night Vegan",
  resourceLink: "https://schoolnightvegan.com/home/vegan-lemon-poppy-seed-scones/",
  // Reception of the linked source recipe.
  validation: { rating: 5, ratingScale: 5, reviewCount: 3 },
  ingredients: [
    // ── Scones ───────────────────────────────────────────────────────────
    { name: "plain white flour", quantity: 420, unit: "g", section: "Scones", note: "all-purpose" },
    { name: "baking powder", quantity: 3, unit: "tsp", section: "Scones" },
    { name: "fine sea salt", quantity: "1/2", unit: "tsp", section: "Scones" },
    { name: "poppy seeds", quantity: 1, unit: "tbsp", section: "Scones" },
    { name: "caster sugar", quantity: 100, unit: "g", section: "Scones", note: "superfine" },
    { name: "lemon zest", quantity: 2, unit: "lemon", section: "Scones", note: "finely shredded" },
    { name: "vegan butter", quantity: 120, unit: "g", section: "Scones", note: "cold, cubed" },
    { name: "vegan yogurt", quantity: 100, unit: "g", section: "Scones", note: "unflavoured, unsweetened" },
    { name: "lemon juice", quantity: 4, unit: "tbsp", section: "Scones" },
    { name: "lemon extract", quantity: 1, unit: "tsp", section: "Scones" },
    { name: "vanilla extract", quantity: 1, unit: "tsp", section: "Scones" },
    { name: "plant milk", quantity: 2, unit: "tbsp", section: "Scones", note: "unsweetened, unflavoured; to brush" },
    { name: "demerara sugar", quantity: 2, unit: "tbsp", section: "Scones", note: "to sprinkle" },
    // ── Lemon glaze ─────────────────────────────────────────────────────
    { name: "icing sugar", quantity: 160, unit: "g", section: "Lemon glaze" },
    { name: "lemon juice", quantity: 1, unit: "tbsp", section: "Lemon glaze" },
    { name: "vanilla extract", quantity: 1, unit: "tsp", section: "Lemon glaze" },
    // ── To serve ────────────────────────────────────────────────────────
    { name: "lemon zest", quantity: 1, unit: "lemon", section: "To serve" },
    { name: "poppy seeds", quantity: 1, unit: "tsp", section: "To serve" },
  ],
  // steps intentionally omitted — externally attributed, we backlink instead
};

const dishData = buildDishData(input);
await runSeed(dishData.title as string, dishData, seedModeFromArgv(process.argv.slice(2)));
