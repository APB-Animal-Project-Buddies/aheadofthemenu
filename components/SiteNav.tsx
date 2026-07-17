"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";

type Tab = { href: string; label: string };

// Nav tabs depend on account mode. Business accounts get the operator tools
// (recipes, menus); consumers get the diner tools (dishes, reverse lookup);
// both share Top Alternatives. Signed-out visitors see the consumer set.
// Keep these lists in sync with the static prototype's `site-nav.js` so the
// emerald bar is identical across Next pages and the static apps.
const CONSUMER_TABS: Tab[] = [
  { href: "/dishes", label: "Dishes" },
  { href: "/top-alternatives", label: "Top Alternatives" },
  { href: "/eat-this", label: "Eat This!" },
  { href: "/protein-guide", label: "Protein Guide" }
];
const BUSINESS_TABS: Tab[] = [
  { href: "/menus", label: "Menus" },
  { href: "/recipes", label: "Recipes" },
  { href: "/top-alternatives", label: "Top Alternatives" },
  { href: "/tips-and-tricks", label: "Tips & Tricks" },
  { href: "/eat-this", label: "Eat This!" },
  { href: "/protein-guide", label: "Protein Guide" }
];

// Some sections belong to one mode regardless of login: a signed-out visitor on a
// business-only page (/recipes, /menus, /tips-and-tricks) still gets the restaurant nav,
// and /dishes always reads as consumer. Shared sections fall back to the account type.
const BUSINESS_SECTIONS = new Set(["recipes", "menus", "tips-and-tricks"]);
const CONSUMER_SECTIONS = new Set(["dishes"]);

// The nav has its own header on the landing + auth screens, and is intentionally
// hidden on the user's profile and public handle pages.
const HIDDEN_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/profile",
];

// Top-level segments that are real app sections (Next routes or static /public
// apps). Anything else with a single unknown leading segment (e.g. /vishnu or
// /vishnu/active-dishes) is a public handle page, where the nav is hidden.
const KNOWN_SECTIONS = new Set([
  "recipes",
  "menus",
  "dishes",
  "top-alternatives",
  "tips-and-tricks",
  "eat-this",
  "reviews",
  "submit-dish",
  "protein-guide",
  "admin",
  "s",
  "hooks",
  "profile",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify",
]);

function isHandlePage(pathname: string): boolean {
  const segs = pathname.split("/").filter(Boolean);
  return segs.length >= 1 && !KNOWN_SECTIONS.has(segs[0]);
}

const CHEVRON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);

export function SiteNav() {
  const pathname = usePathname();
  const { isAuthenticated, email, displayName, avatarUrl, role, userType, signOut } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Nav "mode": signed in → account type wins; else the entry section decides
  // (business-only pages → business, /dishes → consumer), and on ambivalent pages the
  // #business/#consumer param carries the mode forward (no param → consumer).
  const [hash, setHash] = useState("");
  useEffect(() => {
    const read = () => setHash(window.location.hash.replace(/^#/, ""));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [pathname]);

  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  const mode: "business" | "consumer" = isAuthenticated
    ? (userType === "business" ? "business" : "consumer")
    : BUSINESS_SECTIONS.has(seg) ? "business"
      : CONSUMER_SECTIONS.has(seg) ? "consumer"
        : hash === "business" ? "business"
          : "consumer";
  const tabs = mode === "business" ? BUSINESS_TABS : CONSUMER_TABS;
  // Always carry the mode forward on every tab link (no param → consumer).
  const withMode = (href: string) => `${href}#${mode}`;

  if (
    pathname === "/" ||
    HIDDEN_PREFIXES.some((p) => pathname.startsWith(p)) ||
    isHandlePage(pathname)
  ) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-apb-accent/[0.28] bg-gradient-to-b from-[#163320] to-[#112619] text-apb-cream backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 md:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 font-serif text-[17px] font-bold tracking-tight text-apb-cream">
          <svg aria-hidden className="h-[22px] w-[22px] text-apb-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6" />
          </svg>
          <span className="whitespace-nowrap">Ahead of the <em className="italic text-apb-accent">Menu</em></span>
        </Link>

        {/* Tabs — centered on desktop, collapsed into a burger on mobile */}
        <ul className="col-start-2 hidden items-center justify-center gap-7 md:flex">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return (
              <li key={t.href}>
                <Link
                  href={withMode(t.href)}
                  className={`relative flex h-16 items-center text-sm font-medium transition ${active
                    ? "text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-apb-accent"
                    : "text-apb-cream/65 hover:text-apb-cream"
                    }`}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right side: auth controls */}
        <div className="col-start-3 flex items-center justify-end gap-2 text-sm">
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                aria-label="Account menu"
                className="flex items-center gap-1 rounded-full border border-transparent p-0.5 transition hover:border-white/20"
              >
                <Avatar email={email} displayName={displayName} avatarUrl={avatarUrl} size={32} />
                <span className={`text-apb-cream/70 transition ${accountOpen ? "rotate-180" : ""}`}>{CHEVRON}</span>
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-0" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 z-10 mt-2 min-w-[14rem] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 text-neutral-700 shadow-lg">
                    <div className="border-b border-neutral-100 px-4 py-3">
                      <div className="truncate font-semibold text-neutral-800">{displayName || email}</div>
                      {displayName && <div className="truncate text-xs text-neutral-500">{email}</div>}
                      {role && (
                        <span className="mt-1.5 inline-block rounded-full bg-apb-cream px-2 py-0.5 text-[11px] font-medium capitalize text-apb">
                          {role.replace("-", " ")}
                        </span>
                      )}
                    </div>
                    <Link href="/profile" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 transition hover:bg-neutral-50">
                      Profile
                    </Link>
                    <button type="button" onClick={() => { setAccountOpen(false); signOut(); }} className="block w-full px-4 py-2.5 text-left transition hover:bg-neutral-50">
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 font-medium text-apb-cream/85 transition hover:text-apb-cream">Log in</Link>
              {/* Mobile folds Sign up into the login page's "Don't have an
                  account? Create one" link — one auth button up top. */}
              <Link href="/register" className="hidden rounded-full bg-apb-accent px-4 py-1.5 font-semibold text-[#112619] transition hover:bg-apb-accent-light md:inline-block">Sign up</Link>
            </>
          )}

          {/* Mobile burger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Navigation menu"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-apb-cream md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      {/* Mobile tab panel */}
      {mobileOpen && (
        <ul className="border-t border-white/10 px-5 py-2 md:hidden">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return (
              <li key={t.href}>
                <Link
                  href={withMode(t.href)}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2.5 text-sm font-medium transition ${active ? "text-apb-accent" : "text-apb-cream/80 hover:text-apb-cream"}`}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
