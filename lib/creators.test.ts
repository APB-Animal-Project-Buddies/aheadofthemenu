import { test, expect } from "bun:test";
import { slugify, pickCreatorMatch } from "./creators";

test("slugify kebab-cases and strips punctuation", () => {
  expect(slugify("Rainbow Plant Life")).toBe("rainbow-plant-life");
  expect(slugify("Dora's Table")).toBe("dora-s-table");
  expect(slugify("Chef Gauthier Soho (Michelin Star)")).toBe("chef-gauthier-soho-michelin-star");
  expect(slugify("  Café  Olé!  ")).toBe("caf-ol");
});

const rows = [
  { id: "a", display_name: "Rainbow Plant Life", creator_name: null, slug: "rainbow-plant-life", created_at: "2025-01-01T00:00:00Z" },
  { id: "b", display_name: "Nisha Vora", creator_name: "Rainbow Plant Life", slug: "nisha-vora", created_at: "2025-02-01T00:00:00Z" },
  { id: "c", display_name: "Other Person", creator_name: "Rainbow Plant Life", slug: "other-person", created_at: "2025-03-01T00:00:00Z" },
];

test("display_name match beats creator_name match", () => {
  expect(pickCreatorMatch("rainbow plant life", rows)?.id).toBe("a");
});
test("creator_name match used when no display_name match; earliest created_at wins", () => {
  expect(pickCreatorMatch("Rainbow Plant Life", rows.slice(1))?.id).toBe("b");
});
test("no match returns null", () => {
  expect(pickCreatorMatch("Unknown Person", rows)).toBeNull();
});
