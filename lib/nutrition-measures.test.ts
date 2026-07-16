import { test, expect } from "bun:test";
import { estimateVagueMeasure, hasNumericQuantity } from "./nutrition-measures";

test("a real numeric quantity always wins (no estimate)", () => {
  expect(estimateVagueMeasure({ name: "olive oil", quantity: 2, unit: "tbsp" })).toBeNull();
  expect(estimateVagueMeasure({ name: "flour", quantity: "1/2", unit: "cup" })).toBeNull();
  expect(hasNumericQuantity(0)).toBe(true);
  expect(hasNumericQuantity(null)).toBe(false);
  expect(hasNumericQuantity("")).toBe(false);
});

test("vague phrases map to the table values", () => {
  expect(estimateVagueMeasure({ name: "thyme", note: "a few sprigs" })).toMatchObject({ quantity: 3, unit: "g" });
  expect(estimateVagueMeasure({ name: "ground cloves", note: "pinch" })).toMatchObject({ quantity: "1/16", unit: "tsp" });
  expect(estimateVagueMeasure({ name: "olive oil", note: "generously" })).toMatchObject({ quantity: 3, unit: "tbsp" });
  expect(estimateVagueMeasure({ name: "extra virgin olive oil", note: "a drizzle" })).toMatchObject({ quantity: 2, unit: "tsp" });
});

test("handful is herb-aware", () => {
  expect(estimateVagueMeasure({ name: "fresh basil leaves", note: "a handful" })).toMatchObject({ quantity: 10, unit: "g" });
  expect(estimateVagueMeasure({ name: "cashews", note: "a handful" })).toMatchObject({ quantity: 30, unit: "g" });
});

test("to taste is opt-in only", () => {
  const salt = { name: "sea salt", unit: "to_taste", note: "" };
  expect(estimateVagueMeasure(salt)).toBeNull();
  expect(estimateVagueMeasure({ name: "salt", note: "to taste" }, { includeToTaste: true })).toMatchObject({ quantity: "1/2", unit: "tsp" });
});
