/**
 * Creator identity helpers: slug generation and originalCreator → creators-row
 * resolution. Matching precedence (see docs/superpowers/specs/2026-07-21-
 * creator-profiles-design.md §3): exact display_name beats exact creator_name
 * (brand rows keep their historical attributions); creator_name ties resolve
 * to the earliest created_at. Miss ⇒ implicit unclaimed creator row.
 */
export type CreatorRow = {
  id: string;
  display_name: string;
  creator_name: string | null;
  slug: string | null;
  created_at: string;
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
