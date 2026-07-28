/**
 * Video embed support for recipes — YouTube + TikTok links pasted on the submit
 * form, stored in dish_data.videoEmbeds, and rendered (click-to-load) on the dish
 * page between the ingredients and the method.
 *
 * We only ever store a normalized { platform, id, url }, re-parsed from the URL so
 * stored data is always canonical and can't smuggle in an arbitrary embed source.
 */
export type VideoPlatform = "youtube" | "tiktok";
export type VideoEmbed = { platform: VideoPlatform; id: string; url: string };

export const MAX_VIDEO_EMBEDS = 4;

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const TT_NUMERIC_RE = /\/video\/(\d+)/;

/**
 * Parse a pasted URL into a normalized embed, or null if it isn't a supported
 * video link. YouTube: watch / youtu.be / shorts / embed / live. TikTok: full
 * `tiktok.com/@user/video/{id}` links (short vm.tiktok.com links can't yield the
 * numeric id without a network resolve, so they're rejected with guidance).
 */
export function parseVideoUrl(input: string): VideoEmbed | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  // ── YouTube ──────────────────────────────────────────────────────────────
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    if (YT_ID_RE.test(id)) return { platform: "youtube", id, url: `https://www.youtube.com/watch?v=${id}` };
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") {
      const id = u.searchParams.get("v") ?? "";
      if (YT_ID_RE.test(id)) return { platform: "youtube", id, url: `https://www.youtube.com/watch?v=${id}` };
    }
    const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/);
    if (m && YT_ID_RE.test(m[1])) return { platform: "youtube", id: m[1], url: `https://www.youtube.com/watch?v=${m[1]}` };
  }

  // ── TikTok (full video links only) ───────────────────────────────────────
  if (host === "tiktok.com" || host === "m.tiktok.com") {
    const m = u.pathname.match(TT_NUMERIC_RE);
    if (m) return { platform: "tiktok", id: m[1], url: `https://www.tiktok.com${u.pathname}` };
  }

  return null;
}

/**
 * Server-side sanitizer for buildDishData — validates a stored/submitted array,
 * dropping anything unrecognized, de-duplicating, and capping the count.
 * Accepts either raw url strings or `{ url }` objects; always re-parses.
 */
export function sanitizeVideoEmbeds(input: unknown): VideoEmbed[] {
  if (!Array.isArray(input)) return [];
  const out: VideoEmbed[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    const url =
      typeof item === "string"
        ? item
        : item && typeof (item as { url?: unknown }).url === "string"
          ? (item as { url: string }).url
          : "";
    const parsed = parseVideoUrl(url);
    if (!parsed) continue;
    const key = `${parsed.platform}:${parsed.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(parsed);
    if (out.length >= MAX_VIDEO_EMBEDS) break;
  }
  return out;
}

// Render-time URL builders.
export const youTubeThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
export const youTubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
export const tikTokEmbed = (id: string) => `https://www.tiktok.com/player/v1/${id}?autoplay=1`;
export const tikTokOEmbed = (url: string) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
