import { test, expect } from "bun:test";
import { diffEatThisDishFields, formatEatThisField } from "./eat-this-dish-edit-diff";

test("diff only considers proposed keys that are present and changed", () => {
  const cur = { name: "A", description: "d", tags: ["x"], availability: "permanent" };
  const changes = diffEatThisDishFields(cur, { name: "B", description: "d" });
  // description present but unchanged; tags/availability not proposed
  expect(changes.map(([k]) => k)).toEqual(["name"]);
});

test("diff detects tag + availability changes", () => {
  const cur = { name: "A", tags: ["x"], availability: "permanent" };
  const changes = diffEatThisDishFields(cur, { tags: ["x", "y"], availability: "seasonal" });
  expect(changes.map(([k]) => k).sort()).toEqual(["availability", "tags"]);
});

test("formatEatThisField renders arrays and empties", () => {
  expect(formatEatThisField("tags", ["a", "b"])).toBe("a, b");
  expect(formatEatThisField("description", null)).toBe("—");
  expect(formatEatThisField("name", "Tofu Bowl")).toBe("Tofu Bowl");
});
