import { NextRequest, NextResponse } from "next/server";

// Static SPA apps live physically in public/<slug>/ — serve them at the root
// slug via a rewrite so their absolute asset paths keep resolving.
// NOTE: "recipes" is intentionally omitted — /recipes is temporarily deprecated
// and redirected to /dishes in next.config.js pending a terms-of-use review of
// the external sources it curates. Re-add it here to restore the static SPA.
const STATIC_APPS = [
  "menus",
  "top-alternatives",
  "tips-and-tricks",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Serve the static apps at their root slug.
  for (const slug of STATIC_APPS) {
    if (pathname === `/${slug}`) {
      return NextResponse.rewrite(new URL(`/${slug}/index.html`, request.url));
    }
  }

  // /dishes is a real Next.js route (app/dishes) — served natively, no rewrite.
}

export const config = {
  // Run on everything except Next internals, API routes, and files with an
  // extension (static assets in /public).
  matcher: ["/((?!_next/|api/|.*\\.).*)"],
};
