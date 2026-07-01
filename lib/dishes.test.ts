import { test, expect } from "bun:test";
import { CUISINES, DISH_TYPES, ALLERGENS, UNITS, TRIED_BY, buildDishData } from "./dishes";

test("allowed sets are frozen lists", () => {
  expect(TRIED_BY).toEqual(["just_me", "friends", "family", "strangers", "a_lot"]);
  expect(UNITS).toContain("cup");
});

test("buildDishData requires a title", () => {
  expect(() => buildDishData({ title: "" } as any)).toThrow(/title/i);
  expect(() => buildDishData({} as any)).toThrow(/title/i);
});

test("buildDishData keeps only allowed fields and normalizes ingredients", () => {
  const d = buildDishData({
    title: "  Vegan Mac  ",
    description: "Cheesy",
    cuisines: ["american", "italian"],
    dishType: ["main"],
    tags: ["bulk-prep", "  "],
    ingredients: [
      { name: " Cashews ", quantity: 1.5, unit: "cup", id: "en:cashew" },
      { name: "", quantity: 2, unit: "g" },
      { name: "Salt", quantity: "x" as any, unit: "bogus" },
    ],
    allergens: ["nuts", "gluten"],
    cost: 1.85,
    resourceLink: "https://example.com/r",
    notes: "verify",
    submittedBy: { name: "VA", email: "va@example.com" },
    validation: { triedBy: ["friends", "bogus"], reviewCount: 2000, rating: 8, ratingScale: 10 },
    injected: "drop",
  } as any);

  expect(d.title).toBe("Vegan Mac");
  expect(d.cuisines).toEqual(["american", "italian"]);
  expect(d.tags).toEqual(["bulk-prep"]);
  expect(d.dishType).toEqual(["main"]);
  expect(d.ingredients).toEqual([
    { name: "Cashews", quantity: 1.5, unit: "cup", id: "en:cashew" },
    { name: "Salt", quantity: null, unit: "bogus" },
  ]);
  expect(d.cost).toBe(1.85);
  expect(d.validation).toEqual({ triedBy: ["friends"], reviewCount: 2000, rating: 8, ratingScale: 10 });
  expect((d as any).injected).toBeUndefined();
});

test("buildDishData validates email, url, number ranges", () => {
  expect(() => buildDishData({ title: "x", submittedBy: { email: "nope" } } as any)).toThrow(/email/i);
  expect(() => buildDishData({ title: "x", resourceLink: "not a url" } as any)).toThrow(/url|link/i);
  expect(() => buildDishData({ title: "x", cost: -1 } as any)).toThrow(/cost/i);
  expect(() => buildDishData({ title: "x", validation: { rating: 9, ratingScale: 5 } } as any)).toThrow(/rating/i);
});

test("buildDishData drops invalid triedBy but keeps the rest", () => {
  const d = buildDishData({ title: "x", validation: { triedBy: ["bogus"], reviewCount: 5 } } as any);
  expect(d.validation).toEqual({ reviewCount: 5 });
});

test("buildDishData keeps non-empty steps as a string array", () => {
  expect(buildDishData({ title: "x", steps: ["Boil water", "  ", "Add pasta"] } as any).steps)
    .toEqual(["Boil water", "Add pasta"]);
  expect("steps" in buildDishData({ title: "x", steps: ["", "   "] } as any)).toBe(false);
});

test("UNITS includes the newly added units", () => {
  for (const u of ["mg", "fl_oz", "pt", "qt", "gallon", "stick", "mm", "cm", "inch", "splash", "cube"]) {
    expect(UNITS as readonly string[]).toContain(u);
  }
});

// ── Ingredient sections (multi-part recipes), backwards-compatible with legacy rows ──

test("buildDishData backwards-compat: a legacy row with no section is unchanged", () => {
  const d = buildDishData({ title: "x", ingredients: [{ name: "Flour", quantity: 2, unit: "cup" }] } as any);
  expect(d.ingredients).toEqual([{ name: "Flour", quantity: 2, unit: "cup" }]);
  expect("section" in (d.ingredients as any[])[0]).toBe(false);
});

test("buildDishData preserves section when present, omits when empty", () => {
  const d = buildDishData({
    title: "x",
    ingredients: [
      { name: "Tofu", quantity: 400, unit: "g", section: "  Main  " },
      { name: "Salt", quantity: null, unit: "to_taste", section: "   " },
    ],
  } as any);
  expect((d.ingredients as any[])[0].section).toBe("Main");
  expect("section" in (d.ingredients as any[])[1]).toBe(false);
});

// ── Ingredient alternatives (nested swaps), backwards-compatible with legacy rows ──

test("buildDishData backwards-compat: a legacy row gains no alternatives key", () => {
  const d = buildDishData({ title: "x", ingredients: [{ name: "Flour", quantity: 2, unit: "cup" }] } as any);
  expect("alternatives" in (d.ingredients as any[])[0]).toBe(false);
});

test("buildDishData backwards-compat: real legacy ingredients (pre-sections/alternatives) round-trip untouched", () => {
  // A representative slice of an actual stored draft (Zuppa Toscana Vegana) from
  // before sections/alternatives existed — the flat {name, quantity, unit} shape.
  const legacy = [
    { name: "Beyond Meat Hot Italian Sausage", quantity: 2, unit: "piece" },
    { name: "olive oil", quantity: null, unit: null },
    { name: "red onion", quantity: 2, unit: "piece" },
    { name: "liquid smoke", quantity: 2, unit: "tsp" },
    { name: "garlic", quantity: 4, unit: "tsp" },
  ];
  const d = buildDishData({ title: "Zuppa Toscana Vegana", ingredients: legacy } as any);
  const rows = d.ingredients as any[];
  // Core fields preserved (null unit coerces to "" exactly as it always has).
  expect(rows).toEqual([
    { name: "Beyond Meat Hot Italian Sausage", quantity: 2, unit: "piece" },
    { name: "olive oil", quantity: null, unit: "" },
    { name: "red onion", quantity: 2, unit: "piece" },
    { name: "liquid smoke", quantity: 2, unit: "tsp" },
    { name: "garlic", quantity: 4, unit: "tsp" },
  ]);
  // The new fields are never invented for legacy data.
  for (const r of rows) {
    expect("section" in r).toBe(false);
    expect("alternatives" in r).toBe(false);
  }
});

test("buildDishData keeps multi-line alternatives with label + note, sanitizing lines", () => {
  const d = buildDishData({
    title: "x",
    ingredients: [
      {
        name: "Tofu", quantity: 400, unit: "g", section: "Main",
        alternatives: [
          { label: "  Cauliflower  ", note: "  roast first  ", items: [{ name: " cauliflower ", quantity: 1, unit: "head" }] },
          { label: "Seitan", items: [
            { name: "vital wheat gluten", quantity: 1, unit: "cup", id: "en:gluten" },
            { name: "veg broth", quantity: "x" as any, unit: "bogus" },
            { name: "  ", quantity: 1, unit: "cup" }, // nameless line dropped
          ] },
        ],
      },
    ],
  } as any);
  expect((d.ingredients as any[])[0].alternatives).toEqual([
    { items: [{ name: "cauliflower", quantity: 1, unit: "head" }], label: "Cauliflower", note: "roast first" },
    { items: [
      { name: "vital wheat gluten", quantity: 1, unit: "cup", id: "en:gluten" },
      { name: "veg broth", quantity: null, unit: "bogus" },
    ], label: "Seitan" },
  ]);
  // no note on the second alternative
  expect("note" in (d.ingredients as any[])[0].alternatives[1]).toBe(false);
});

test("buildDishData drops an alternative whose lines are all empty", () => {
  const d = buildDishData({
    title: "x",
    ingredients: [
      { name: "Egg", quantity: 1, unit: "piece", alternatives: [
        { label: "Nothing", items: [{ name: "  " }] },
        { label: "Flax egg", items: [{ name: "flax meal", quantity: 1, unit: "tbsp" }] },
      ] },
    ],
  } as any);
  const alts = (d.ingredients as any[])[0].alternatives;
  expect(alts).toHaveLength(1);
  expect(alts[0].label).toBe("Flax egg");
});

test("buildDishData caps alternatives per ingredient and lines per alternative", () => {
  const manyAlts = Array.from({ length: 20 }, (_, i) => ({ label: `a${i}`, items: [{ name: `x${i}`, quantity: 1, unit: "g" }] }));
  const manyLines = Array.from({ length: 30 }, (_, i) => ({ name: `line${i}`, quantity: 1, unit: "g" }));
  const d = buildDishData({
    title: "x",
    ingredients: [{ name: "Base", quantity: 1, unit: "g", alternatives: [{ label: "big", items: manyLines }, ...manyAlts] }],
  } as any);
  const alts = (d.ingredients as any[])[0].alternatives;
  expect(alts.length).toBe(6); // MAX_ALTS_PER_INGREDIENT
  expect(alts[0].items.length).toBe(12); // MAX_ALT_LINES
});

test("buildDishData round-trips a full new-format dish (sections + nested alternatives + a legacy row)", () => {
  // The canonical V2 stored shape: sections group rows, alternatives stay nested on
  // their parent row (single- and multi-line, with label + note), and a sectionless
  // legacy-style row coexists in the same list.
  const d = buildDishData({
    title: "Tofu Donburi",
    ingredients: [
      {
        name: "firm tofu", quantity: 400, unit: "g", section: "Main",
        alternatives: [
          { label: "Cauliflower", note: "roast first — firmer bite, less protein",
            items: [{ name: "cauliflower", quantity: 1, unit: "head" }] },
          { label: "Seitan", note: "not gluten-free", items: [
            { name: "vital wheat gluten", quantity: 1, unit: "cup", id: "en:gluten" },
            { name: "vegetable broth", quantity: 0.75, unit: "cup" },
          ] },
        ],
      },
      { name: "soy sauce", quantity: 2, unit: "tbsp", section: "Main" },
      {
        name: "all-purpose flour", quantity: 2, unit: "cup", section: "Batter",
        alternatives: [
          { label: "Gluten-free", note: "swap 1:1; batter sets a touch softer",
            items: [{ name: "1:1 GF flour blend", quantity: 2, unit: "cup" }] },
        ],
      },
      { name: "salt", quantity: null, unit: "to_taste" }, // legacy-style row, no section/alts
    ],
  } as any);

  expect(d.ingredients).toEqual([
    {
      name: "firm tofu", quantity: 400, unit: "g", section: "Main",
      alternatives: [
        { items: [{ name: "cauliflower", quantity: 1, unit: "head" }],
          label: "Cauliflower", note: "roast first — firmer bite, less protein" },
        { items: [
            { name: "vital wheat gluten", quantity: 1, unit: "cup", id: "en:gluten" },
            { name: "vegetable broth", quantity: 0.75, unit: "cup" },
          ], label: "Seitan", note: "not gluten-free" },
      ],
    },
    { name: "soy sauce", quantity: 2, unit: "tbsp", section: "Main" },
    {
      name: "all-purpose flour", quantity: 2, unit: "cup", section: "Batter",
      alternatives: [
        { items: [{ name: "1:1 GF flour blend", quantity: 2, unit: "cup" }],
          label: "Gluten-free", note: "swap 1:1; batter sets a touch softer" },
      ],
    },
    { name: "salt", quantity: null, unit: "to_taste" },
  ]);
});
