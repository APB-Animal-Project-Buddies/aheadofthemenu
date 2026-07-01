// Pure data (no server deps) so BOTH the client form and the server-side
// extractor can import it. Edit these lists in one place and the form picker +
// the extraction prompt stay in sync.

// Branded plant-based products to surface — the single biggest lever on
// recognizing niche items (Juicy Marbles, Chunk Foods) a model would skip.
export const PLANT_BASED_BRANDS = {
  meat: [
    "Juicy Marbles", "Chunk Foods", "Beyond Meat", "Impossible", "Gardein",
    "MorningStar", "Tofurky", "Field Roast", "Lightlife", "Quorn", "Meati",
    "Daring", "Abbot's Butcher", "Upton's Naturals", "No Evil Foods",
  ],
  dairyCheese: [
    "Daiya", "Follow Your Heart", "Miyoko's", "Violife", "Kite Hill", "Chao",
    "Treeline", "So Delicious", "Oatly", "Forager", "Califia Farms", "Ripple",
    "Earth Balance", "Country Crock Plant Butter",
  ],
  egg: ["JUST Egg", "Simply Eggless", "Crackd"],
  seafood: ["Good Catch", "Sophie's Kitchen", "Jinka", "Konscious", "Plant Based Seafood Co", "Oshi"],
  bouillon: ["Better Than Bouillon", "Edward & Sons Not-Chick'n", "Massel", "Seitenbacher"],
  specialtyStaples: [
    "nutritional yeast", "aquafaba", "vital wheat gluten", "seitan", "TVP",
    "tempeh", "kala namak (black salt)", "liquid smoke", "agar", "jackfruit",
  ],
} as const;

// Rare / expensive / hard-to-find ingredients — prohibitive on cost or
// availability alone (no brand needed), or just not in a normal kitchen/restaurant.
export const RARE_EXPENSIVE_INGREDIENTS = [
  "saffron", "black truffle", "white truffle", "truffle oil", "cardamom",
  "matsutake mushroom", "morel mushroom", "porcini", "vanilla bean",
  "fennel pollen", "sumac", "asafoetida (hing)", "Sichuan peppercorn",
  "star anise", "pine nuts", "juniper berries", "kaffir lime leaves",
  "fresh curry leaves", "gochugaru", "kombu", "dried shiitake", "pink peppercorn",
] as const;

// Flat, de-duplicated option list for the form's special-products picker.
export const SPECIAL_PRODUCT_OPTIONS: readonly string[] = Array.from(
  new Set([
    ...PLANT_BASED_BRANDS.meat,
    ...PLANT_BASED_BRANDS.dairyCheese,
    ...PLANT_BASED_BRANDS.egg,
    ...PLANT_BASED_BRANDS.seafood,
    ...PLANT_BASED_BRANDS.bouillon,
    ...PLANT_BASED_BRANDS.specialtyStaples,
    ...RARE_EXPENSIVE_INGREDIENTS,
  ])
);

// Hint strings woven into the extraction prompt (server side).
export const BRAND_HINTS =
  `meat: ${PLANT_BASED_BRANDS.meat.join(", ")}; ` +
  `cheese/dairy/butter: ${PLANT_BASED_BRANDS.dairyCheese.join(", ")}; ` +
  `egg: ${PLANT_BASED_BRANDS.egg.join(", ")}; ` +
  `seafood: ${PLANT_BASED_BRANDS.seafood.join(", ")}; ` +
  `bouillon/broth: ${PLANT_BASED_BRANDS.bouillon.join(", ")}; ` +
  `specialty staples: ${PLANT_BASED_BRANDS.specialtyStaples.join(", ")}`;

export const RARE_HINTS = RARE_EXPENSIVE_INGREDIENTS.join(", ");
