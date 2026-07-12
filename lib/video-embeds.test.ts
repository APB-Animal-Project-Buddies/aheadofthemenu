import { test, expect } from "bun:test";
import { parseVideoUrl, sanitizeVideoEmbeds, MAX_VIDEO_EMBEDS } from "./video-embeds";

test("parses YouTube in its many URL shapes to the 11-char id", () => {
  const id = "dQw4w9WgXcQ";
  for (const url of [
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://m.youtube.com/watch?v=${id}&t=30s`,
  ]) {
    expect(parseVideoUrl(url)).toEqual({ platform: "youtube", id, url: `https://www.youtube.com/watch?v=${id}` });
  }
});

test("parses a full TikTok video link to its numeric id", () => {
  const r = parseVideoUrl("https://www.tiktok.com/@chef/video/7412345678901234567?is_from_webapp=1");
  expect(r).toEqual({
    platform: "tiktok",
    id: "7412345678901234567",
    url: "https://www.tiktok.com/@chef/video/7412345678901234567",
  });
});

test("rejects unsupported / unparseable links", () => {
  for (const bad of [
    "",
    "not a url",
    "ftp://youtube.com/watch?v=dQw4w9WgXcQ",
    "https://vimeo.com/12345",
    "https://www.instagram.com/reel/abc123/",
    "https://vm.tiktok.com/ZMabc123/", // short link — no numeric id without a resolve
    "https://www.youtube.com/watch?v=short", // id not 11 chars
  ]) {
    expect(parseVideoUrl(bad)).toBeNull();
  }
});

test("sanitize dedupes, caps, and accepts raw strings or {url} objects", () => {
  const id = "dQw4w9WgXcQ";
  const out = sanitizeVideoEmbeds([
    `https://youtu.be/${id}`,
    { url: `https://www.youtube.com/watch?v=${id}` }, // same video, different shape → deduped
    "https://www.tiktok.com/@a/video/111",
    "https://www.tiktok.com/@b/video/222",
    "garbage",
    "https://www.tiktok.com/@c/video/333",
    "https://www.tiktok.com/@d/video/444", // 5th unique → dropped by the cap
  ]);
  expect(out.map((e) => e.id)).toEqual([id, "111", "222", "333"]);
  expect(out.length).toBeLessThanOrEqual(MAX_VIDEO_EMBEDS);
});
