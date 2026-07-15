import { test, expect } from "bun:test";
import { diffRlDishFields, formatRlField } from "./rl-dish-edit-diff";

test("diff only considers proposed keys that are present and changed", () => {
  const cur = { name: "A", description: "d", tags: ["x"], availability: "permanent" };
  const changes = diffRlDishFields(cur, { name: "B", description: "d" });
  // description present but unchanged; tags/availability not proposed
  expect(changes.map(([k]) => k)).toEqual(["name"]);
});

test("diff detects tag + availability changes", () => {
  const cur = { name: "A", tags: ["x"], availability: "permanent" };
  const changes = diffRlDishFields(cur, { tags: ["x", "y"], availability: "seasonal" });
  expect(changes.map(([k]) => k).sort()).toEqual(["availability", "tags"]);
});

test("formatRlField renders arrays and empties", () => {
  expect(formatRlField("tags", ["a", "b"])).toBe("a, b");
  expect(formatRlField("description", null)).toBe("—");
  expect(formatRlField("name", "Tofu Bowl")).toBe("Tofu Bowl");
});
