import { test, expect, describe } from "bun:test";
import { slugify, pickCreatorMatch, socialHandle, creatorSearchTerms, parseInstagramUrl, parseGalleryLink, sanitizeGallery, MAX_GALLERY_ITEMS } from "./creators";

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

describe("gallery", () => {
  test("parseInstagramUrl accepts posts, reels and tv; rejects profiles and other hosts", () => {
    expect(parseInstagramUrl("https://www.instagram.com/p/CxYz_12-ab/?utm=1")).toEqual({ kind: "instagram", id: "CxYz_12-ab", url: "https://www.instagram.com/p/CxYz_12-ab/" });
    expect(parseInstagramUrl("https://instagram.com/reel/DEF456ghi")).toEqual({ kind: "instagram", id: "DEF456ghi", url: "https://www.instagram.com/p/DEF456ghi/" });
    expect(parseInstagramUrl("https://www.instagram.com/mixforamission/reel/DEF456ghi/")?.id).toBe("DEF456ghi");
    expect(parseInstagramUrl("https://www.instagram.com/mixforamission/")).toBeNull();
    expect(parseInstagramUrl("https://www.tiktok.com/@x/video/123")).toBeNull();
    expect(parseInstagramUrl("nope")).toBeNull();
  });
  test("YouTube Shorts are flagged vertical, and the flag survives re-sanitizing", () => {
    expect(parseGalleryLink("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toEqual({ kind: "video", platform: "youtube", id: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", vertical: true });
    expect(parseGalleryLink("https://youtu.be/dQw4w9WgXcQ")).not.toHaveProperty("vertical");
    expect(sanitizeGallery([{ kind: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", vertical: true }])[0]).toHaveProperty("vertical", true);
    expect(sanitizeGallery([{ kind: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }])[0]).not.toHaveProperty("vertical");
  });
  test("parseGalleryLink routes to video or instagram", () => {
    expect(parseGalleryLink("https://youtu.be/dQw4w9WgXcQ")).toEqual({ kind: "video", platform: "youtube", id: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
    expect(parseGalleryLink("https://www.tiktok.com/@x/video/7000000000000000000")?.kind).toBe("video");
    expect(parseGalleryLink("https://www.instagram.com/p/ABCDEFG/")?.kind).toBe("instagram");
    expect(parseGalleryLink("https://example.com")).toBeNull();
  });
  test("sanitizeGallery normalizes, drops junk, de-dupes and caps", () => {
    const out = sanitizeGallery([
      { kind: "image", url: " https://x.storage.nhost.run/v1/files/abc ", caption: "  Hi " },
      { kind: "image", url: "http://insecure.example/x.jpg" },
      { url: "https://youtu.be/dQw4w9WgXcQ" },
      { kind: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      { url: "https://www.instagram.com/reel/ABCDEFG/" },
      "garbage",
      null,
    ]);
    expect(out).toEqual([
      { kind: "image", url: "https://x.storage.nhost.run/v1/files/abc", caption: "Hi" },
      { kind: "video", platform: "youtube", id: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      { kind: "instagram", id: "ABCDEFG", url: "https://www.instagram.com/p/ABCDEFG/" },
    ]);
    const many = Array.from({ length: 20 }, (_, i) => ({ kind: "image", url: `https://h/${i}.jpg` }));
    expect(sanitizeGallery(many)).toHaveLength(MAX_GALLERY_ITEMS);
    expect(sanitizeGallery("not an array")).toEqual([]);
  });
});
