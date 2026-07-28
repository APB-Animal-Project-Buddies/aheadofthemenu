/**
 * sitemap.xml — served by Next's metadata route convention at /sitemap.xml.
 *
 * Covers static pages, every creator profile, and every dish. See
 * docs/superpowers/specs/2026-07-17-seo-sitemap-and-indexable-pages-design.md.
 *
 * Covers `/eat-this/{id}` for live dishes only — hidden entries are excluded so
 * the sitemap never advertises a URL that 404s.
 *
 * Deliberately excluded:
 * - `/recipes` — 302s to /dishes pending a terms-of-use review (next.config.js).
 * - Auth, profile, admin, submit, and short-link routes — private, transient, or
 *   duplicative.
 *
 * Total is well under the 50k-URL limit, so this stays a single sitemap rather
 * than an index.
 */
import type { MetadataRoute } from "next";
import { graphql } from "@/lib/nhost";
import { absoluteUrl } from "@/lib/site-url";

// Regenerate hourly. The catalogue changes on the order of days, and this keeps
// one Nhost query per hour regardless of crawler traffic.
//
// The query below MUST pass `revalidate` — graphql defaults to `cache: "no-store"`,
// which would force this route fully dynamic and make this constant inert.
export const revalidate = 3600;

type StaticEntry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const STATIC_PAGES: StaticEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/dishes", changeFrequency: "daily", priority: 0.9 },
  { path: "/creators", changeFrequency: "daily", priority: 0.9 },
  { path: "/eat-this", changeFrequency: "daily", priority: 0.8 },
  { path: "/top-alternatives", changeFrequency: "weekly", priority: 0.7 },
  { path: "/tips-and-tricks", changeFrequency: "monthly", priority: 0.5 },
  { path: "/menus", changeFrequency: "monthly", priority: 0.5 },
  // Live and complete, just unlinked from the nav while the Creators launch
  // takes focus. Drop this line if it should stay out of search too.
  { path: "/protein-guide", changeFrequency: "monthly", priority: 0.6 },
];

type Row = {
  slug?: string | null;
  id?: number;
  /** restaurant_dishes ids are uuids; aliased so they don't collide with the
   * integer `id` on dishes in the same typed response. */
  uuid?: string;
  created_at?: string | null;
};

async function getDynamicEntries(): Promise<MetadataRoute.Sitemap> {
  const res = await graphql<{ creators: Row[]; dishes: Row[]; restaurant_dishes: Row[] }>(
    `query {
       creators(where: { slug: { _is_null: false } }) { slug created_at }
       dishes { id created_at }
       restaurant_dishes(where: { status: { _eq: "live" } }) { uuid: id created_at }
     }`,
    { useAdminSecret: true, revalidate }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);

  const creators = (res.data?.creators ?? [])
    .filter((c) => c.slug)
    .map((c) => ({
      url: absoluteUrl(`/creators/${c.slug}`),
      lastModified: c.created_at ? new Date(c.created_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const dishes = (res.data?.dishes ?? [])
    .filter((d) => typeof d.id === "number")
    .map((d) => ({
      url: absoluteUrl(`/dishes/${d.id}`),
      lastModified: d.created_at ? new Date(d.created_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  const eatThis = (res.data?.restaurant_dishes ?? [])
    .filter((d) => d.uuid)
    .map((d) => ({
      url: absoluteUrl(`/eat-this/${d.uuid}`),
      lastModified: d.created_at ? new Date(d.created_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [...creators, ...dishes, ...eatThis];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: absoluteUrl(p.path),
    lastModified: new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  try {
    return [...staticEntries, ...(await getDynamicEntries())];
  } catch (error) {
    // A degraded sitemap beats a 500. Nhost cold starts and outages shouldn't
    // make the whole file disappear from under a crawler mid-fetch.
    console.error("sitemap: dynamic entries failed, serving static only:", error);
    return staticEntries;
  }
}
