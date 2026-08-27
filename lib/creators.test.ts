import { test, expect, describe } from "bun:test";
import { slugify, pickCreatorMatch, socialHandle, creatorSearchTerms } from "./creators";

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


describe("socialHandle", () => {
  test("extracts handles from the common social URL shapes", () => {
    expect(socialHandle("https://www.instagram.com/plantsinaslurry/")).toBe("plantsinaslurry");
    expect(socialHandle("https://youtube.com/@NoraCooks?sub_confirmation=1")).toBe("NoraCooks");
    expect(socialHandle("https://www.tiktok.com/@vegan.richa")).toBe("vegan.richa");
    expect(socialHandle("https://noracooks.substack.com")).toBe("noracooks");
    expect(socialHandle("https://www.youtube.com/channel/UCabc123")).toBe("UCabc123");
  });
  test("returns null for empty, bare-host, or malformed URLs", () => {
    expect(socialHandle(null)).toBeNull();
    expect(socialHandle("")).toBeNull();
    expect(socialHandle("https://facebook.com/")).toBeNull();
    expect(socialHandle("not a url")).toBeNull();
    expect(socialHandle("https://www.substack.com")).toBeNull();
  });
});

describe("creatorSearchTerms", () => {
  test("includes names, slug and handles, deduped and trimmed", () => {
    expect(
      creatorSearchTerms({ display_name: "PlantsInASlurry", creator_name: " PlantsInASlurry ", slug: "plantsinaslurry", handles: ["plantsinaslurry", "plantsinaslurry"] })
    ).toEqual(["PlantsInASlurry", "plantsinaslurry"]);
    expect(creatorSearchTerms({ display_name: "Nora Cooks", creator_name: null, slug: null, handles: [] })).toEqual(["Nora Cooks"]);
  });
});
