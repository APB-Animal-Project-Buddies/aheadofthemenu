/**
 * robots.txt — served by Next's metadata route convention at /robots.txt.
 *
 * Allows public content, keeps crawlers out of private and transient routes,
 * and points at the sitemap.
 *
 * Preview deployments emit a blanket disallow: they share the production
 * database, so an indexed preview URL would compete with the canonical site for
 * the same content.
 */
import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl, isPreview } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  if (isPreview) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/profile",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify",
          "/submit-dish",
          // Short links and QR claims — redirects, not content.
          "/s/",
          "/q/",
          // Edit and suggest forms hang off dish pages; the dish page itself is
          // the canonical URL.
          "/dishes/*/edit",
          "/dishes/*/suggest",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
