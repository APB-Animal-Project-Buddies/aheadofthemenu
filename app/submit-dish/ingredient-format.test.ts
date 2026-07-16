import { test, expect } from "bun:test";
import { buildDishData } from "../../lib/dishes";
import { normalizeStoredIngredients } from "./ingredient-format";
import { diffDishFields } from "../../lib/dish-edit-diff";

// A nested-recipe link (ingredient.nestedDishId) must survive the full edit round-trip:
// build → store → edit-mode prefill. Before the fix, prefill dropped nestedDishId, so
// editing a dish silently unlinked its nested recipes on save.
test("nestedDishId survives build → edit-prefill round-trip", () => {
  const data = buildDishData({
    title: "Double Panisse",
    ingredients: [{ name: "Panisse", quantity: "", unit: "", nestedDishId: 195 }],
  });
  const stored = (data.ingredients as any[])[0];
  expect(stored.nestedDishId).toBe(195);

  const groups = normalizeStoredIngredients(data.ingredients);
  expect(groups[0].items[0].nestedDishId).toBe(195);
});

// The edit-difference algorithm must flag a change that only relinks/unlinks a nested
// recipe — otherwise such a proposed edit would render as "no differences".
test("edit-diff detects a nestedDishId-only change", () => {
  const plain = buildDishData({ title: "T", ingredients: [{ name: "Panisse", quantity: "", unit: "" }] });
  const linked = buildDishData({ title: "T", ingredients: [{ name: "Panisse", quantity: "", unit: "", nestedDishId: 195 }] });

  const changedKeys = diffDishFields(plain, linked).map(([k]) => k);
  expect(changedKeys).toContain("ingredients");
});
