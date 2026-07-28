/**
 * Add a single dish — Sauro Ricci's "Roasted Tofu with Tamari, Aubergine Flower and
 * Tomato Emulsion" — to the dishes table.
 *
 * Source (backlinked, method NOT reproduced — externally attributed):
 *   https://www.greatitalianchefs.com/recipes/roasted-tofu-recipe-stuffed-tomato
 *
 * Per house convention (see add-vegan-hollandaise-dish.ts): ingredients + details only.
 * The multi-component method is intentionally omitted; we link to the source
 * (`resourceLink`) and credit the creator (`originalCreator`) instead of copying the
 * method verbatim.
 *
 * Usage:
 *   bun scripts/add-roasted-tofu-aubergine-flower-dish.ts             # dry-run (default): build + print dish_data, NO DB
 *   bun scripts/add-roasted-tofu-aubergine-flower-dish.ts --check     # compare against the live row, no write
 *   bun scripts/add-roasted-tofu-aubergine-flower-dish.ts --execute   # idempotent insert (matched by dish_name)
 */

import { buildDishData } from "../lib/dishes";
import { runSeed, seedModeFromArgv } from "./seed-dish";

const input = {
  title: "Roasted Tofu with Tamari, Aubergine Flower and Tomato Emulsion",
  description:
    "Chef Sauro Ricci's stunning vegan plated dish: aubergine wrapped in tomato 'petals', " +
    "tamari-roasted semi-hard tofu, and a set of colourful component sauces — a transparent " +
    "tomato-water emulsion, a charcoal black sauce, a parsley green sauce and a red tomato sauce.",
  cuisines: ["italian"],
  dishType: ["main"],
  tags: ["fancy"],
  difficulty: 2, // source: "Medium"
  servings: 10,
  allergens: ["soy"],
  possibleAllergens: ["gluten"], // tamari is brand-dependent for wheat
  originalCreator: "Sauro Ricci",
  resourceLink: "https://www.greatitalianchefs.com/recipes/roasted-tofu-recipe-stuffed-tomato",
  notes: "Elaborate multi-component plated dish. Total time (source): 2 hrs 30 mins. Full method at the source link.",
  ingredients: [
    // Aubergine and tomato 'flower'
    { name: "aubergine", quantity: 400, unit: "g", section: "Aubergine and tomato 'flower'", note: "about 2 large" },
    { name: "tomatoes", quantity: 300, unit: "g", section: "Aubergine and tomato 'flower'", note: "about 7 large red" },
    { name: "parsley leaves", quantity: 200, unit: "g", section: "Aubergine and tomato 'flower'" },
    { name: "extra virgin olive oil", quantity: "", unit: "", section: "Aubergine and tomato 'flower'" },
    { name: "salt", quantity: "", unit: "to_taste", section: "Aubergine and tomato 'flower'" },
    { name: "pepper", quantity: "", unit: "to_taste", section: "Aubergine and tomato 'flower'" },

    // Transparent sauce
    { name: "tomatoes", quantity: 750, unit: "g", section: "Transparent sauce" },
    { name: "salt", quantity: "", unit: "to_taste", section: "Transparent sauce" },
    { name: "yellow cornflour", quantity: 12, unit: "g", section: "Transparent sauce", note: "mixed with water" },
    { name: "kuzu", quantity: 12, unit: "g", section: "Transparent sauce" },

    // Black sauce
    { name: "yellow cornflour", quantity: 12, unit: "g", section: "Black sauce", note: "mixed with water" },
    { name: "charcoal powder", quantity: "", unit: "", section: "Black sauce" },

    // Green sauce
    { name: "parsley", quantity: 120, unit: "g", section: "Green sauce" },
    { name: "yellow cornflour", quantity: 10, unit: "g", section: "Green sauce", note: "mixed with water" },
    { name: "oil", quantity: "", unit: "", section: "Green sauce" },
    { name: "salt", quantity: "", unit: "to_taste", section: "Green sauce" },

    // Red sauce
    { name: "tomatoes", quantity: 200, unit: "g", section: "Red sauce" },
    { name: "salt", quantity: 2, unit: "g", section: "Red sauce" },
    { name: "cornflour", quantity: 10, unit: "g", section: "Red sauce" },

    // Pan-roasted tofu
    { name: "semi-hard tofu", quantity: 750, unit: "g", section: "Pan-roasted tofu", note: "cut into blocks" },
    { name: "tamari", quantity: "", unit: "", section: "Pan-roasted tofu" },
  ],
  // steps intentionally omitted — externally attributed, we backlink instead
};

const dishData = buildDishData(input);
await runSeed(dishData.title as string, dishData, seedModeFromArgv(process.argv.slice(2)));
