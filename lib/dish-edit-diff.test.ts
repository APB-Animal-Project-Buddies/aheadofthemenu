import { test, expect } from "bun:test";
import { buildDishData } from "./dishes";
import { diffDishFields, DISH_EDIT_FIELDS, formatDishField } from "./dish-edit-diff";

const keys = (pairs: Array<[string, string]>) => pairs.map(([k]) => k);

test("videoEmbeds is a tracked diff field", () => {
  expect(keys(DISH_EDIT_FIELDS)).toContain("videoEmbeds");
});

test("adding a video link to a recipe is detected as a difference (regression)", () => {
  // Mirrors the propose flow: proposed = buildDishData({ ...existing, ...edit }).
  const base = { title: "Vegan Zuppa", ingredients: [{ name: "kale", quantity: "1", unit: "bunch" }] };
  const current = buildDishData(base);
  const proposed = buildDishData({
    ...base,
    videoEmbeds: [{ platform: "youtube", id: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }],
  });

  const diff = diffDishFields(current, proposed);
  expect(keys(diff)).toContain("videoEmbeds"); // <-- was silently missing before the fix
});

test("no changes ⇒ no field differences (including matching absent videoEmbeds)", () => {
  const d = buildDishData({ title: "X", ingredients: [{ name: "a", quantity: "1", unit: "cup" }] });
  expect(diffDishFields(d, d)).toEqual([]);
});

test("changing an existing video link is detected", () => {
  const withVid = (id: string) =>
    buildDishData({
      title: "X",
      ingredients: [{ name: "a", quantity: "1", unit: "cup" }],
      videoEmbeds: [{ platform: "youtube", id, url: `https://www.youtube.com/watch?v=${id}` }],
    });
  const diff = diffDishFields(withVid("dQw4w9WgXcQ"), withVid("9bZkp7q19f0"));
  expect(keys(diff)).toContain("videoEmbeds");
});

test("still detects an ordinary title change", () => {
  const a = buildDishData({ title: "Old", ingredients: [{ name: "a", quantity: "1", unit: "cup" }] });
  const b = buildDishData({ title: "New", ingredients: [{ name: "a", quantity: "1", unit: "cup" }] });
  expect(keys(diffDishFields(a, b))).toEqual(["title"]);
});

test("formatDishField renders video links readably", () => {
  const out = formatDishField("videoEmbeds", [
    { platform: "youtube", id: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { platform: "tiktok", id: "111", url: "https://www.tiktok.com/@a/video/111" },
  ]);
  expect(out).toBe("youtube: https://www.youtube.com/watch?v=dQw4w9WgXcQ\ntiktok: https://www.tiktok.com/@a/video/111");
});
