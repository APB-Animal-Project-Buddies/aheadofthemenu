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

/** A most-watched clip on one platform, with a ready-to-embed (muted-autoplay) URL. */
export type CreatorTopVideo = {
  url: string;
  video_id?: string | null;
  title?: string | null;
  approx_views?: string | null;
  embed_url?: string | null;
};

/** Full public profile row rendered by the creator page. */
export type CreatorProfile = CreatorRow & {
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

const PROFILE_FIELDS = `
  id display_name creator_name slug created_at
  real_name bio website image_url
  youtube instagram tiktok facebook twitter_x pinterest substack
  primary_social other_links top_videos
`;

/** Full profile by slug for /creators/[slug]. Read-only; null when not found. */
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
  if (!row) return null;
  // Hasura returns jsonb as parsed values already; normalize the nullable shapes.
  return {
    ...row,
    other_links: Array.isArray(row.other_links) ? row.other_links : [],
    top_videos: row.top_videos && typeof row.top_videos === "object" ? row.top_videos : null,
  };
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
       creators(order_by: { display_name: asc }) { id slug display_name creator_name image_url bio }
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
    }))
    .filter((c) => c.slug && (c.bio || c.image_url || c.dishCount > 0));
}
