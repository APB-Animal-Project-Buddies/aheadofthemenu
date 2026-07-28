import { test, expect } from "bun:test";
import { buildDishData } from "./dishes";

const base = { title: "X" };

test("ingredient `optional: true` is preserved; false/absent is omitted", () => {
  const d = buildDishData({
    ...base,
    ingredients: [
      { name: "almonds", quantity: "3", unit: "tbsp", optional: true },
      { name: "flour", quantity: "200", unit: "g", optional: false },
      { name: "sugar", quantity: "100", unit: "g" },
    ],
  }) as any;
  expect(d.ingredients[0].optional).toBe(true);
  expect("optional" in d.ingredients[1]).toBe(false); // false → omitted (back-compat)
  expect("optional" in d.ingredients[2]).toBe(false);
});

test("possibleAllergens: enum-filtered and deduped against definite (definite wins)", () => {
  const d = buildDishData({
    ...base,
    allergens: ["gluten", "soy"],
    possibleAllergens: ["nuts", "soy", "not-an-allergen", "coconut"],
  }) as any;
  // "soy" is definite → dropped from possible; "not-an-allergen" → filtered out.
  expect(d.possibleAllergens).toEqual(["nuts", "coconut"]);
  expect(d.allergens).toEqual(["gluten", "soy"]);
});

test("empty possibleAllergens is omitted entirely", () => {
  const d = buildDishData({ ...base, allergens: ["gluten"] }) as any;
  expect("possibleAllergens" in d).toBe(false);
});
