/**
 * lib/site-url.ts
 *
 * Single source of truth for the canonical origin. Every absolute URL the app
 * emits — sitemap entries, robots, OG tags, agent-API `url` fields — must come
 * from here, so there is exactly one place to change if the host ever moves.
 *
 * Canonical host is **www**, per
 * docs/superpowers/specs/2026-07-17-seo-sitemap-and-indexable-pages-design.md.
 * The apex is expected to 301 to www at the DNS/Vercel level; that is not
 * enforced here.
 */

const FALLBACK = "https://www.aheadofthemenu.com";

/**
 * Prefers an explicit NEXT_PUBLIC_SITE_URL so preview deployments can emit
 * their own origin rather than pointing crawlers at production. Falls back to
 * the canonical host.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK).replace(/\/+$/, "");

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** True when this build is a Vercel preview rather than production. Used to
 * keep previews out of search results. */
export const isPreview =
  process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development";
