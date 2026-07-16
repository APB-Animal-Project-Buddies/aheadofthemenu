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

// A product link (ingredient.productId) must survive the same round-trip, and an edit
// that only links/unlinks a product must register as an ingredients change.
test("productId survives build → edit-prefill round-trip and is diff-detected", () => {
  const data = buildDishData({
    title: "Tortellini",
    ingredients: [{ name: "plant cheese", quantity: "3", unit: "tbsp", productId: "prod-123" }],
  });
  expect((data.ingredients as any[])[0].productId).toBe("prod-123");

  const groups = normalizeStoredIngredients(data.ingredients);
  expect(groups[0].items[0].productId).toBe("prod-123");

  const plain = buildDishData({ title: "T", ingredients: [{ name: "plant cheese", quantity: "", unit: "" }] });
  const changedKeys = diffDishFields(plain, data).map(([k]) => k);
  expect(changedKeys).toContain("ingredients");
});
