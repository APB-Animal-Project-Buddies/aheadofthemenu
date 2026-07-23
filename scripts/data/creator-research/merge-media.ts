/**
 * Fold the media-workflow output (images + top-videos + the 22 newly-researched
 * profiles) into profiles-merged.json — the canonical dataset the backfill reads.
 *
 * Read-only against the DB (only to map brand -> creator row ids for entities
 * that weren't already in the dataset). Writes only local JSON files.
 *
 *   bun scripts/data/creator-research/merge-media.ts <workflow-output.json>
 *
 * The workflow output is the task .output file ({ result: { results: [...] } })
 * or a bare array of result objects. A timestamped backup of the previous
 * profiles-merged.json is kept alongside.
 */
import { graphql } from "../../../lib/nhost";

const MERGED = "scripts/data/creator-research/profiles-merged.json";
const outPath = process.argv[2];
if (!outPath) {
  console.error("usage: bun scripts/data/creator-research/merge-media.ts <workflow-output.json>");
  process.exit(1);
}

type MediaResult = {
  brand: string;
  need_research?: boolean;
  profile?: any | null;
  image?: { url?: string | null; source_url?: string | null } | null;
  top_videos?: any | null;
  error?: string;
};

function extractResults(raw: any): MediaResult[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.result?.results)) return raw.result.results;
  throw new Error("Could not find results[] in workflow output");
}

// Brand -> creator row ids, deduped exactly like the workflow input.
async function brandRowIds(): Promise<Map<string, Array<{ id: string; display_name: string }>>> {
  const res = await graphql<{ creators: Array<{ id: string; display_name: string; creator_name: string | null }> }>(
    `query { creators(order_by: { created_at: asc }) { id display_name creator_name } }`,
    { useAdminSecret: true }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);
  const map = new Map<string, Array<{ id: string; display_name: string }>>();
  for (const r of res.data?.creators ?? []) {
    const brand = (r.creator_name || r.display_name).toLowerCase().trim();
    if (!map.has(brand)) map.set(brand, []);
    map.get(brand)!.push({ id: r.id, display_name: r.display_name });
  }
  return map;
}

async function main() {
  const raw = await Bun.file(outPath).json();
  const media = extractResults(raw);
  const merged: any[] = await Bun.file(MERGED).json();
  const rowIdMap = await brandRowIds();

  const byBrand = new Map<string, any>(merged.map((e) => [e.brand.toLowerCase(), e]));
  let addedImages = 0, addedVideos = 0, newProfiles = 0, failures = 0;

  for (const r of media) {
    if (r.error) { failures++; continue; }
    const key = r.brand.toLowerCase();
    let entity = byBrand.get(key);

    if (!entity) {
      // Newly-researched creator not previously in the dataset.
      entity = {
        brand: r.brand,
        row_ids: rowIdMap.get(key) ?? [],
        profile: r.profile ?? null,
        verification_changes: ["unverified — media run"],
        top_videos: null,
      };
      byBrand.set(key, entity);
      merged.push(entity);
      if (r.profile) newProfiles++;
    } else if (r.profile && !entity.profile) {
      entity.profile = r.profile;
      newProfiles++;
    }

    if (r.image && r.image.url) { entity.image = { url: r.image.url, source_url: r.image.source_url ?? null }; addedImages++; }
    const tv = r.top_videos;
    if (tv && (tv.youtube || tv.tiktok || tv.instagram)) { entity.top_videos = tv; addedVideos++; }
  }

  merged.sort((a, b) => a.brand.localeCompare(b.brand));
  const backup = `${MERGED}.bak-${raw?.result?.count ?? media.length}`;
  await Bun.write(backup, await Bun.file(MERGED).text());
  await Bun.write(MERGED, JSON.stringify(merged, null, 2));

  const withImg = merged.filter((e) => e.image?.url).length;
  const withVid = merged.filter((e) => e.top_videos && (e.top_videos.youtube || e.top_videos.tiktok || e.top_videos.instagram)).length;
  const withProfile = merged.filter((e) => e.profile).length;
  console.log(`Merged ${media.length} media results (${failures} errors).`);
  console.log(`  +${addedImages} images, +${addedVideos} videos, +${newProfiles} new profiles this run.`);
  console.log(`Dataset now: ${merged.length} entities | ${withProfile} with bio/socials | ${withImg} with image | ${withVid} with video.`);
  console.log(`Backup: ${backup}`);
}

main();
