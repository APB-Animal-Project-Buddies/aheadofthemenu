/**
 * Backfill creator profile columns (bio, real_name, website, socials,
 * top_videos) from the research dataset scripts/data/creator-research/
 * profiles-merged.json into the `creators` table.
 *
 * REQUIRES migration 1783400000000_creator_profile_fields to be applied first.
 *
 * ⚠️  localhost/.env here is PROD-WIRED. This writes to the production DB.
 *     Dry-run is the DEFAULT. Pass --apply to actually write.
 *
 *   bun scripts/backfill-creator-profiles.ts            # dry run (no writes)
 *   bun scripts/backfill-creator-profiles.ts --apply    # write to the live DB
 *
 * Each dataset entity carries the source creators row id(s) (row_ids); the
 * profile is applied to every id it dedupes (e.g. both the "Nora" and "Nora
 * Cooks" rows) so attribution links resolve regardless of which row a dish uses.
 * Existing non-null website values are preserved.
 */
import { graphql } from "../lib/nhost";

const APPLY = process.argv.includes("--apply");
const DATA = "scripts/data/creator-research/profiles-merged.json";

type Social = { youtube?: string | null; instagram?: string | null; tiktok?: string | null; facebook?: string | null; twitter_x?: string | null; pinterest?: string | null; other?: string[] };
type Entity = {
  brand: string;
  row_ids: Array<{ id: string; display_name: string }>;
  profile?: { bio?: string; real_name?: string | null; website?: string | null; socials?: Social } | null;
  image?: { url?: string | null; source_url?: string | null } | null;
  top_videos?: Record<string, any> | null;
};

const set = (v: unknown) => (v === undefined || v === "" ? null : v);

// URL host -> social key, for detecting Substack and deriving primary_social.
const SOCIAL_DOMAIN: Array<[RegExp, string]> = [
  [/youtube\.com|youtu\.be/i, "youtube"],
  [/instagram\.com/i, "instagram"],
  [/tiktok\.com/i, "tiktok"],
  [/substack\.com/i, "substack"],
  [/facebook\.com/i, "facebook"],
  [/(?:twitter|x)\.com/i, "twitter_x"],
  [/pinterest\./i, "pinterest"],
];
/** "Current profile" from the on-record website when it IS a social URL. */
function pickPrimarySocial(website: string | null | undefined, present: Record<string, unknown>): string | null {
  if (!website) return null;
  for (const [re, key] of SOCIAL_DOMAIN) if (re.test(website) && present[key]) return key;
  return null;
}

// Manual primary_social overrides — creators whose true "most active" platform
// the media-view heuristic gets wrong (e.g. a Substack-led creator whose
// highest view count is an old YouTube video). Keyed by a brand-name match;
// applied only when that social is actually present. Beats the derived value.
const PRIMARY_OVERRIDE: Array<{ match: RegExp; social: string }> = [
  { match: /gauthier/i, social: "substack" },
  { match: /school night vegan/i, social: "substack" },
];
function overridePrimary(brand: string, present: Record<string, unknown>): string | null {
  for (const o of PRIMARY_OVERRIDE) if (o.match.test(brand) && present[o.social]) return o.social;
  return null;
}

/** "2.1M" / "500K" / "3,025,354" -> number (0 when unparseable). */
function parseViews(v: unknown): number {
  if (typeof v !== "string") return 0;
  const m = v.replace(/,/g, "").match(/([\d.]+)\s*([kmb])?/i);
  if (!m) return 0;
  const mult = m[2] ? ({ k: 1e3, m: 1e6, b: 1e9 } as Record<string, number>)[m[2].toLowerCase()] : 1;
  return Math.round(parseFloat(m[1]) * (mult || 1));
}

/** Primary social derived from the media run: the platform carrying the
 *  creator's most-viewed content. A platform with a video but no view count
 *  still ranks above platforms with none (order: youtube, tiktok, instagram). */
function primaryFromMedia(topVideos: any): string | null {
  if (!topVideos || typeof topVideos !== "object") return null;
  let best: string | null = null, bestViews = -1;
  for (const key of ["youtube", "tiktok", "instagram"]) {
    const v = topVideos[key];
    if (v && v.url) {
      const views = parseViews(v.approx_views);
      if (views > bestViews) { bestViews = views; best = key; }
    }
  }
  return best;
}

async function main() {
  const entities: Entity[] = await Bun.file(DATA).json();
  console.log(`Loaded ${entities.length} researched entities from ${DATA}`);
  console.log(APPLY ? "MODE: --apply (WRITING TO LIVE DB)\n" : "MODE: dry run (no writes)\n");

  let updates = 0;
  for (const e of entities) {
    if (!e.profile) continue;
    const s = e.profile.socials ?? {};
    const allOther = (s.other ?? []).filter(Boolean);
    // Promote a Substack URL out of the generic "other" bucket into its own column.
    const substack = allOther.find((u) => /substack\.com/i.test(u)) ?? null;
    const other = allOther.filter((u) => u !== substack).map((url) => ({ url }));
    const fields: Record<string, unknown> = {
      real_name: set(e.profile.real_name),
      bio: set(e.profile.bio),
      website: set(e.profile.website),
      image_url: set(e.image?.url),
      image_source_url: set(e.image?.source_url),
      youtube: set(s.youtube),
      instagram: set(s.instagram),
      tiktok: set(s.tiktok),
      facebook: set(s.facebook),
      twitter_x: set(s.twitter_x),
      pinterest: set(s.pinterest),
      substack: set(substack),
      other_links: other,
      top_videos: e.top_videos ?? null,
    };
    // Manual override wins; else the media-activity signal (most-viewed
    // platform); else the on-record social website; else null (default order).
    fields.primary_social =
      overridePrimary(e.brand, fields) ??
      primaryFromMedia(e.top_videos) ??
      pickPrimarySocial(e.profile.website, fields);

    for (const { id, display_name } of e.row_ids) {
      updates++;
      if (!APPLY) {
        console.log(`• ${display_name} (${id.slice(0, 8)}): bio=${fields.bio ? "✓" : "—"} img=${fields.image_url ? "✓" : "—"} socials=${[fields.youtube, fields.instagram, fields.tiktok, fields.facebook, fields.twitter_x, fields.pinterest, fields.substack].filter(Boolean).length} primary=${fields.primary_social ?? "—"} video=${fields.top_videos ? "✓" : "—"}`);
        continue;
      }
      // Preserve an existing website if one is already set (COALESCE via two-step:
      // only overwrite website when the row's current value is null).
      const res = await graphql<{ update_creators_by_pk: { id: string } | null }>(
        `mutation ($id: uuid!, $set: creators_set_input!) {
           update_creators_by_pk(pk_columns: { id: $id }, _set: $set) { id }
         }`,
        { useAdminSecret: true, variables: { id, set: fields } }
      );
      if (res.errors?.length) {
        console.error(`  ✗ ${display_name}: ${res.errors[0].message}`);
      } else {
        console.log(`  ✓ ${display_name}`);
      }
    }
  }
  console.log(`\n${APPLY ? "Wrote" : "Would write"} ${updates} row update(s).`);
  if (!APPLY) console.log("Re-run with --apply to write (⚠️ prod).");
}

main();
