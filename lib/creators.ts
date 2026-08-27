/**
 * Creator identity helpers: slug generation, originalCreator → creators-row
 * resolution, and profile fetching for /creators/[slug].
 *
 * Matching precedence: exact display_name beats exact creator_name (brand rows
 * keep their historical attributions); creator_name ties resolve to the earliest
 * created_at. Miss ⇒ implicit unclaimed creator row. The `slug`/profile columns
 * are added by migration 1783400000000_creator_profile_fields.
 */
export type CreatorRow = {
  id: string;
  display_name: string;
  creator_name: string | null;
  slug: string | null;
  created_at: string;
};

/** Curation flags: `hidden` pulls a creator out of public pages; `plant_based`
 * records whether the creator's own brand is fully vegan (null = not yet reviewed). */
export type CreatorFlags = {
  hidden: boolean;
  plant_based: boolean | null;
};

/** A most-watched clip on one platform, with a ready-to-embed (muted-autoplay) URL. */
import { parseVideoUrl, type VideoPlatform } from "@/lib/video-embeds";

export type CreatorTopVideo = {
  url: string;
  video_id?: string | null;
  title?: string | null;
  approx_views?: string | null;
  embed_url?: string | null;
};

/** One gallery tile on a creator page (creators.gallery JSONB). */
export type GalleryItem =
  /** w/h: pixel size measured at upload, so the gallery can shape the tile to the photo. */
  | { kind: "image"; url: string; caption?: string; w?: number; h?: number }
  /** vertical: a YouTube Short (TikTok is always vertical). The canonical url loses /shorts/, so it's recorded here. */
  | { kind: "video"; platform: VideoPlatform; id: string; url: string; vertical?: boolean }
  | { kind: "instagram"; id: string; url: string };

export const MAX_GALLERY_ITEMS = 12;

/** Tile shape for a gallery item from its real dimensions: wide → 2 columns, tall → 2 rows, else square. */
export function galleryTileShape(g: GalleryItem): "wide" | "tall" | "square" {
  if (g.kind === "video") return g.platform === "tiktok" || g.vertical ? "tall" : "wide";
  if (g.kind === "image" && g.w && g.h) {
    const r = g.w / g.h;
    if (r >= 1.4) return "wide";
    if (r <= 0.72) return "tall";
  }
  return "square";
}
const IG_SHORTCODE_RE = /^[A-Za-z0-9_-]{5,20}$/;

/** Instagram post / reel URL → normalized item, or null. */
export function parseInstagramUrl(input: string): Extract<GalleryItem, { kind: "instagram" }> | null {
  let u: URL;
  try {
    u = new URL((input ?? "").trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "instagram.com" && host !== "instagr.am") return null;
  const m = u.pathname.match(/^\/(?:[^/]+\/)?(p|reel|reels|tv)\/([^/?#]+)/);
  if (!m || !IG_SHORTCODE_RE.test(m[2])) return null;
  return { kind: "instagram", id: m[2], url: `https://www.instagram.com/p/${m[2]}/` };
}

/** A pasted link → gallery item (YouTube/TikTok via parseVideoUrl, Instagram here), or null. */
export function parseGalleryLink(input: string): GalleryItem | null {
  const v = parseVideoUrl(input);
  if (v) {
    const isShort = v.platform === "youtube" && /\/shorts\//i.test(input);
    return isShort ? { kind: "video", ...v, vertical: true } : { kind: "video", ...v };
  }
  return parseInstagramUrl(input);
}

/**
 * Server-side sanitizer for creators.gallery: re-parses every link so stored
 * data is canonical, only accepts https image URLs, de-dupes, caps the count.
 */
export function sanitizeGallery(input: unknown): GalleryItem[] {
  if (!Array.isArray(input)) return [];
  const out: GalleryItem[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    let item: GalleryItem | null = null;
    if (r.kind === "image" && typeof r.url === "string" && /^https:\/\/.+/i.test(r.url.trim())) {
      const caption = typeof r.caption === "string" ? r.caption.trim().slice(0, 200) : "";
      item = caption ? { kind: "image", url: r.url.trim(), caption } : { kind: "image", url: r.url.trim() };
      const w = Number(r.w), h = Number(r.h);
      if (Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0 && w < 100_000 && h < 100_000) item = { ...item, w, h };
    } else if (typeof r.url === "string") {
      item = parseGalleryLink(r.url);
      // Stored rows carry the canonical watch URL, so keep an explicit flag.
      if (item?.kind === "video" && item.platform === "youtube" && r.vertical === true) item = { ...item, vertical: true };
    }
    if (!item) continue;
    const key = item.kind === "image" ? `image:${item.url}` : `${item.kind}:${item.kind === "video" ? item.platform + ":" : ""}${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= MAX_GALLERY_ITEMS) break;
  }
  return out;
}

/** A featured cookbook on a creator page (creators.cookbooks JSONB). */
export type Cookbook = { title: string; url: string; cover?: string; blurb?: string };
export const MAX_COOKBOOKS = 6;

/** Server-side sanitizer for creators.cookbooks: title + https link required, cover/blurb optional, de-duped by url, capped. */
export function sanitizeCookbooks(input: unknown): Cookbook[] {
  if (!Array.isArray(input)) return [];
  const out: Cookbook[] = [];
  const seen = new Set<string>();
  const https = /^https:\/\/.+/i;
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const title = typeof r.title === "string" ? r.title.trim().slice(0, 120) : "";
    const url = typeof r.url === "string" ? r.url.trim() : "";
    if (!title || !https.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const item: Cookbook = { title, url };
    if (typeof r.cover === "string" && https.test(r.cover.trim())) item.cover = r.cover.trim();
    if (typeof r.blurb === "string" && r.blurb.trim()) item.blurb = r.blurb.trim().slice(0, 200);
    out.push(item);
    if (out.length >= MAX_COOKBOOKS) break;
  }
  return out;
}

/** Full public profile row rendered by the creator page. */
export type CreatorProfile = CreatorRow & CreatorFlags & {
  owner_id: string | null;
  real_name: string | null;
  bio: string | null;
  website: string | null;
  image_url: string | null;
  youtube: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  twitter_x: string | null;
  pinterest: string | null;
  substack: string | null;
  other_links: Array<{ label?: string; url: string }>;
  top_videos: Partial<Record<"youtube" | "tiktok" | "instagram", CreatorTopVideo>> | null;
  gallery: GalleryItem[];
  cookbooks: Cookbook[];
  // Which social the profile leads with ("current profile"); editable, not computed.
  primary_social: string | null;
};

/** Named socials in default display order (before primary_social is applied). */
export const CREATOR_SOCIALS: Array<{ key: keyof CreatorProfile; label: string }> = [
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "substack", label: "Substack" },
  { key: "facebook", label: "Facebook" },
  { key: "twitter_x", label: "X" },
  { key: "pinterest", label: "Pinterest" },
];

/** Allowed values of the `creator_social_key` Postgres DOMAIN (constrains `primary_social`). */
export const CREATOR_SOCIAL_KEYS = [
  "youtube",
  "instagram",
  "tiktok",
  "facebook",
  "twitter_x",
  "pinterest",
  "substack",
  "website",
] as const;

/** The creator's present socials as {key,label,url}, with primary_social first. */
export function orderedSocials(c: CreatorProfile): Array<{ key: string; label: string; url: string }> {
  const present = CREATOR_SOCIALS
    .map((s) => ({ key: String(s.key), label: s.label, url: (c as any)[s.key] as string | null }))
    .filter((s): s is { key: string; label: string; url: string } => !!s.url);
  const p = c.primary_social;
  if (!p) return present;
  return present.sort((a, b) => (b.key === p ? 1 : 0) - (a.key === p ? 1 : 0));
}

/** One dish attributed to a creator, for the profile's recipe list. */
export type CreatorDish = { id: number; dish_name: string | null; dish_data: any };

/** A creator card for the /creators gallery, with cuisines derived from dishes. */
export type GalleryCreator = {
  id: string;
  slug: string | null;
  display_name: string;
  creator_name: string | null;
  image_url: string | null;
  bio: string | null;
  cuisines: string[];
  dishCount: number;
  plant_based: boolean | null;
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Pure precedence rule over candidate rows (rows assumed created_at ascending). */
export function pickCreatorMatch(name: string, rows: CreatorRow[]): CreatorRow | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return (
    sorted.find((r) => r.display_name.trim().toLowerCase() === n) ??
    sorted.find((r) => (r.creator_name ?? "").trim().toLowerCase() === n) ??
    null
  );
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

async function candidatesFor(name: string): Promise<CreatorRow[]> {
  const { graphql } = await import("@/lib/nhost");
  const pat = escapeLike(name.trim());
  const res = await graphql<{ creators: CreatorRow[] }>(
    `query ($n: String!) {
       creators(
         where: { _or: [{ display_name: { _ilike: $n } }, { creator_name: { _ilike: $n } }] }
         order_by: { created_at: asc }
       ) { id display_name creator_name slug created_at }
     }`,
    { useAdminSecret: true, variables: { n: pat } }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);
  return res.data?.creators ?? [];
}

/** Read-only lookup — used by render paths (dish page). Never inserts. */
export async function findCreatorByName(name: string): Promise<CreatorRow | null> {
  if (!name.trim()) return null;
  return pickCreatorMatch(name, await candidatesFor(name));
}

/**
 * Find-or-create for write paths. On miss, inserts an unclaimed creator row
 * (display_name = typed name) with a slug; retries with -2, -3… suffixes on
 * slug collisions. Returns null only for blank names.
 */
export async function resolveOrCreateCreator(name: string): Promise<{ id: string; slug: string | null } | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const match = pickCreatorMatch(trimmed, await candidatesFor(trimmed));
  if (match) return { id: match.id, slug: match.slug };

  const base = slugify(trimmed) || "creator";
  const { graphql } = await import("@/lib/nhost");
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const res = await graphql<{ insert_creators_one: { id: string; slug: string } | null }>(
      `mutation ($dn: String!, $slug: String!) {
         insert_creators_one(object: { display_name: $dn, slug: $slug }) { id slug }
       }`,
      { useAdminSecret: true, variables: { dn: trimmed.slice(0, 120), slug } }
    );
    if (!res.errors?.length && res.data?.insert_creators_one) return res.data.insert_creators_one;
    const msg = res.errors?.[0]?.message ?? "";
    if (/creators_display_name_lower_idx/i.test(msg)) {
      // Raced with another insert of the same name — re-resolve.
      const again = pickCreatorMatch(trimmed, await candidatesFor(trimmed));
      if (again) return { id: again.id, slug: again.slug };
    }
    if (!/unique|duplicate/i.test(msg)) throw new Error(msg || "creator insert failed");
  }
  throw new Error(`could not allocate slug for creator "${trimmed}"`);
}

/** Read-only lookup — every claimable creator (unclaimed, not hidden), for the
 * claim-search entry point. Small table; the caller filters client-side. */
export type UnclaimedCreator = {
  id: string;
  display_name: string;
  creator_name: string | null;
  slug: string | null;
  /** Social handles (no "@"), derived from the profile's social URLs — e.g. ["plantsinaslurry"]. */
  handles: string[];
};

const SOCIAL_URL_COLUMNS = ["youtube", "instagram", "tiktok", "facebook", "twitter_x", "pinterest", "substack"] as const;

/**
 * The handle a social URL points at, or null when there isn't one:
 *   https://www.instagram.com/plantsinaslurry/      → "plantsinaslurry"
 *   https://youtube.com/@NoraCooks?sub=1            → "NoraCooks"
 *   https://www.tiktok.com/@vegan.richa             → "vegan.richa"
 *   https://noracooks.substack.com                  → "noracooks"
 *   https://www.youtube.com/channel/UCabc123        → "UCabc123" (still searchable)
 *   https://facebook.com/                           → null
 */
export function socialHandle(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (host.endsWith(".substack.com")) {
    const sub = host.slice(0, -".substack.com".length);
    return sub && sub !== "www" ? sub : null;
  }
  const segs = u.pathname.split("/").filter(Boolean);
  if (!segs.length) return null;
  const last = segs[segs.length - 1].replace(/^@/, "").replace(/\.html?$/i, "");
  return last || null;
}

/** Every string a searcher might type to find this creator: names, slug, handles. */
export function creatorSearchTerms(c: Pick<UnclaimedCreator, "display_name" | "creator_name" | "slug" | "handles">): string[] {
  const out = new Set<string>();
  for (const t of [c.display_name, c.creator_name, c.slug, ...c.handles]) {
    const v = t?.trim();
    if (v) out.add(v);
  }
  return Array.from(out);
}

export async function getUnclaimedCreators(): Promise<UnclaimedCreator[]> {
  const { graphql } = await import("@/lib/nhost");
  type Row = { id: string; display_name: string; creator_name: string | null; slug: string | null } & Record<
    (typeof SOCIAL_URL_COLUMNS)[number],
    string | null
  >;
  const res = await graphql<{ creators: Row[] }>(
    `query {
       creators(where: { owner_id: { _is_null: true }, hidden: { _eq: false } }, order_by: { display_name: asc }) {
         id display_name creator_name slug ${SOCIAL_URL_COLUMNS.join(" ")}
       }
     }`,
    { useAdminSecret: true }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);
  return (res.data?.creators ?? []).map((r) => ({
    id: r.id,
    display_name: r.display_name,
    creator_name: r.creator_name,
    slug: r.slug,
    handles: Array.from(new Set(SOCIAL_URL_COLUMNS.map((k) => socialHandle(r[k])).filter((h): h is string => !!h))),
  }));
}

/** Thrown by createOwnedCreator when the display name is already taken —
 * distinct from a slug collision (which is retried silently). */
export class CreatorNameTakenError extends Error {}

/**
 * Create a brand-new creator profile owned immediately by `userId` (path b of
 * claiming: "this isn't listed yet"). Always INSERTs — never find-or-create —
 * so an existing name surfaces as CreatorNameTakenError rather than silently
 * resolving to (and letting the caller believe they now own) someone else's
 * row; claiming an existing name goes through the claim flow instead. Same
 * slugify + retry-on-slug-collision shape as resolveOrCreateCreator.
 */
export async function createOwnedCreator(
  userId: string,
  fields: { displayName: string; creatorName?: string; realName?: string; website?: string }
): Promise<{ id: string; slug: string | null }> {
  const trimmed = fields.displayName.trim();
  if (!trimmed) throw new Error("displayName is required");

  const base = slugify(trimmed) || "creator";
  const { graphql } = await import("@/lib/nhost");
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const res = await graphql<{ insert_creators_one: { id: string; slug: string } | null }>(
      `mutation ($dn: String!, $cn: String, $rn: String, $web: String, $slug: String!, $uid: uuid!) {
         insert_creators_one(object: {
           display_name: $dn, creator_name: $cn, real_name: $rn, website: $web, slug: $slug, owner_id: $uid
         }) { id slug }
       }`,
      {
        useAdminSecret: true,
        variables: {
          dn: trimmed.slice(0, 120),
          cn: fields.creatorName?.trim().slice(0, 120) || null,
          rn: fields.realName?.trim().slice(0, 120) || null,
          web: fields.website?.trim() || null,
          slug,
          uid: userId,
        },
      }
    );
    if (!res.errors?.length && res.data?.insert_creators_one) return res.data.insert_creators_one;
    const msg = res.errors?.[0]?.message ?? "";
    if (/creators_display_name_lower_idx/i.test(msg)) {
      throw new CreatorNameTakenError(`"${trimmed}" is already taken`);
    }
    if (!/unique|duplicate/i.test(msg)) throw new Error(msg || "creator insert failed");
    // Slug collision only (name itself was fine) — retry with the next suffix.
  }
  throw new Error(`could not allocate slug for creator "${trimmed}"`);
}

const PROFILE_FIELDS = `
  id display_name creator_name slug created_at
  owner_id
  real_name bio website image_url
  youtube instagram tiktok facebook twitter_x pinterest substack
  primary_social other_links top_videos gallery cookbooks
  hidden plant_based
`;

// Hasura returns jsonb as parsed values already; normalize the nullable shapes
// (shared by every read path that fetches PROFILE_FIELDS).
function normalizeProfile(row: CreatorProfile): CreatorProfile {
  return {
    ...row,
    other_links: Array.isArray(row.other_links) ? row.other_links : [],
    top_videos: row.top_videos && typeof row.top_videos === "object" ? row.top_videos : null,
    gallery: sanitizeGallery(row.gallery),
    cookbooks: sanitizeCookbooks(row.cookbooks),
  };
}

/** Full profile by slug for /creators/[slug]. Read-only; null when not found or hidden. */
export async function getCreatorProfileBySlug(slug: string): Promise<CreatorProfile | null> {
  const s = slug.trim().toLowerCase();
  if (!s) return null;
  const { graphql } = await import("@/lib/nhost");
  const res = await graphql<{ creators: CreatorProfile[] }>(
    `query ($slug: String!) { creators(where: { slug: { _eq: $slug } }, limit: 1) { ${PROFILE_FIELDS} } }`,
    { useAdminSecret: true, variables: { slug: s } }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);
  const row = res.data?.creators?.[0];
  if (!row || row.hidden) return null;
  return normalizeProfile(row);
}

/** Thrown by updateOwnedCreator when the caller doesn't own a creator profile. */
export class CreatorNotFoundError extends Error {}

/** Subset of CreatorProfile's text/URL fields that PATCH /api/creators/mine can update. */
export type CreatorProfilePatch = Partial<{
  displayName: string | null;
  creatorName: string | null;
  realName: string | null;
  bio: string | null;
  website: string | null;
  imageUrl: string | null;
  youtube: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  twitterX: string | null;
  pinterest: string | null;
  substack: string | null;
  primarySocial: string | null;
  otherLinks: Array<{ label?: string; url: string }>;
  gallery: GalleryItem[];
  cookbooks: Cookbook[];
}>;

const PATCH_COLUMNS: Record<keyof CreatorProfilePatch, { column: string; gqlType: string }> = {
  displayName: { column: "display_name", gqlType: "String" },
  creatorName: { column: "creator_name", gqlType: "String" },
  realName: { column: "real_name", gqlType: "String" },
  bio: { column: "bio", gqlType: "String" },
  website: { column: "website", gqlType: "String" },
  imageUrl: { column: "image_url", gqlType: "String" },
  youtube: { column: "youtube", gqlType: "String" },
  instagram: { column: "instagram", gqlType: "String" },
  tiktok: { column: "tiktok", gqlType: "String" },
  facebook: { column: "facebook", gqlType: "String" },
  twitterX: { column: "twitter_x", gqlType: "String" },
  pinterest: { column: "pinterest", gqlType: "String" },
  substack: { column: "substack", gqlType: "String" },
  // `creator_social_key` is a Postgres DOMAIN over text with no Hasura custom-scalar
  // mapping configured, so it shows up in the GraphQL schema as its base type.
  primarySocial: { column: "primary_social", gqlType: "String" },
  otherLinks: { column: "other_links", gqlType: "jsonb" },
  gallery: { column: "gallery", gqlType: "jsonb" },
  cookbooks: { column: "cookbooks", gqlType: "jsonb" },
};

/**
 * Partial update of the caller's own creator profile (owner_id = userId). Only
 * the keys present in `patch` are touched — this is a true partial update, not
 * a full-row replace, so omitted fields are left exactly as they were.
 * Throws CreatorNotFoundError if the caller doesn't own a creator row, or
 * CreatorNameTakenError if a `displayName` change collides with the
 * case-insensitive unique index.
 */
export async function updateOwnedCreator(userId: string, patch: CreatorProfilePatch): Promise<CreatorProfile> {
  const { graphql } = await import("@/lib/nhost");
  const keys = (Object.keys(patch) as Array<keyof CreatorProfilePatch>).filter((k) => patch[k] !== undefined);

  if (!keys.length) {
    const res = await graphql<{ creators: CreatorProfile[] }>(
      `query ($uid: uuid!) { creators(where: { owner_id: { _eq: $uid } }, limit: 1) { ${PROFILE_FIELDS} } }`,
      { useAdminSecret: true, variables: { uid: userId } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    const row = res.data?.creators?.[0];
    if (!row) throw new CreatorNotFoundError();
    return normalizeProfile(row);
  }

  const varDecls = keys.map((k) => `$${k}: ${PATCH_COLUMNS[k].gqlType}`).join(", ");
  const setFields = keys.map((k) => `${PATCH_COLUMNS[k].column}: $${k}`).join(", ");
  const variables: Record<string, unknown> = { uid: userId };
  for (const k of keys) variables[k] = patch[k];

  const res = await graphql<{ update_creators: { returning: CreatorProfile[] } }>(
    `mutation ($uid: uuid!, ${varDecls}) {
       update_creators(where: { owner_id: { _eq: $uid } }, _set: { ${setFields} }) {
         returning { ${PROFILE_FIELDS} }
       }
     }`,
    { useAdminSecret: true, variables }
  );
  if (res.errors?.length) {
    const msg = res.errors[0].message;
    if (/creators_display_name_lower_idx/i.test(msg)) {
      throw new CreatorNameTakenError(msg);
    }
    throw new Error(msg);
  }
  const row = res.data?.update_creators?.returning?.[0];
  if (!row) throw new CreatorNotFoundError();
  return normalizeProfile(row);
}

/**
 * Dishes attributed to a creator, newest first. Primary link is the
 * dishes.creator_id FK; we also union dishes whose free-text
 * dish_data.originalCreator still matches (display_name or creator_name) so the
 * list is complete even before the FK backfill has run.
 */
export async function getCreatorDishes(creator: Pick<CreatorProfile, "id" | "display_name" | "creator_name">): Promise<CreatorDish[]> {
  const { graphql } = await import("@/lib/nhost");
  const names = [creator.display_name, creator.creator_name].filter(Boolean) as string[];
  // FK match, plus jsonb-contains match on the legacy free-text attribution for
  // each of the creator's names (so the list is complete pre-backfill). Built as
  // a dishes_bool_exp variable so the OR is evaluated server-side.
  const where = {
    _or: [
      { creator_id: { _eq: creator.id } },
      ...names.map((n) => ({ dish_data: { _contains: { originalCreator: n } } })),
    ],
  };
  const res = await graphql<{ dishes: CreatorDish[] }>(
    `query ($where: dishes_bool_exp!) {
       dishes(where: $where, order_by: { created_at: desc }) { id dish_name dish_data }
     }`,
    { useAdminSecret: true, variables: { where } }
  ).catch(() => ({ data: { dishes: [] as CreatorDish[] }, errors: undefined as any }));
  if (res.errors?.length) return [];
  return res.data?.dishes ?? [];
}

/**
 * All creators for the /creators gallery, each annotated with the cuisines and
 * count of the dishes attributed to them (via creator_id FK, or the legacy
 * free-text originalCreator name where the FK isn't set yet). Only creators with
 * something to show — a bio, an image, or at least one dish — are returned, so
 * bare placeholder rows don't clutter the gallery.
 */
export async function getCreatorsGallery(): Promise<GalleryCreator[]> {
  const { graphql } = await import("@/lib/nhost");
  const res = await graphql<{ creators: any[]; dishes: any[] }>(
    `query {
       creators(where: { hidden: { _eq: false } }, order_by: { display_name: asc }) {
         id slug display_name creator_name image_url bio plant_based
       }
       dishes { creator_id dish_data }
     }`,
    { useAdminSecret: true }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);
  const creators = res.data?.creators ?? [];
  const dishes = res.data?.dishes ?? [];

  // Name -> creator id for legacy attribution. display_name has precedence over
  // creator_name (set last so it wins when a string is both).
  const byName = new Map<string, string>();
  for (const c of creators) if (c.creator_name) byName.set(c.creator_name.toLowerCase().trim(), c.id);
  for (const c of creators) byName.set(c.display_name.toLowerCase().trim(), c.id);

  const cuisineSets = new Map<string, Set<string>>();
  const counts = new Map<string, number>();
  for (const d of dishes) {
    const cid = d.creator_id ?? byName.get(String(d.dish_data?.originalCreator ?? "").toLowerCase().trim());
    if (!cid) continue;
    counts.set(cid, (counts.get(cid) ?? 0) + 1);
    if (!cuisineSets.has(cid)) cuisineSets.set(cid, new Set());
    const cs = Array.isArray(d.dish_data?.cuisines) ? d.dish_data.cuisines : [];
    for (const cu of cs) if (cu) cuisineSets.get(cid)!.add(String(cu));
  }

  return creators
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      display_name: c.display_name,
      creator_name: c.creator_name,
      image_url: c.image_url,
      bio: c.bio,
      cuisines: Array.from(cuisineSets.get(c.id) ?? []).sort(),
      dishCount: counts.get(c.id) ?? 0,
      plant_based: c.plant_based ?? null,
    }))
    .filter((c) => c.slug && (c.bio || c.image_url || c.dishCount > 0));
}
