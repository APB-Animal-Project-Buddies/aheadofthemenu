"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type Tab = { href: string; label: string };
type Variant = "business" | "consumer";

// Same dropdown component, two tab sets.
const TABS: Record<Variant, Tab[]> = {
  business: [
    { href: "/recipes", label: "Recipes" },
    { href: "/menus", label: "Menus" },
    { href: "/tips-and-tricks", label: "Tips & Tricks" },
  ],
  consumer: [
    { href: "/dishes", label: "Dishes" },
    { href: "/top-alternatives", label: "Top Alternatives" },
    { href: "/reverse-lookup", label: "Reverse Lookup" },
  ],
};

const PATH_LABEL: Record<Variant, string> = {
  business: "For chefs & restaurants",
  consumer: "For home cooks",
};

// Routes that belong to each path — used to pick the variant for logged-out
// visitors (i.e. by which entry point / section they're in).
const ROUTE_VARIANT: [string, Variant][] = [
  ["/recipes", "business"],
  ["/menus", "business"],
  ["/tips-and-tricks", "business"],
  ["/dishes", "consumer"],
  ["/top-alternatives", "consumer"],
  ["/reverse-lookup", "consumer"],
];

// The nav is hidden on the landing (its own header) and the auth screens.
const HIDDEN_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify"];

function variantFor(userType: string | null, pathname: string): Variant {
  if (userType === "business" || userType === "consumer") return userType;
  const hit = ROUTE_VARIANT.find(([r]) => pathname.startsWith(r));
  return hit ? hit[1] : "consumer"; // default path for logged-out, unknown route
}

export function SiteNav() {
  const pathname = usePathname();
  const { userType, isAuthenticated, email, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (pathname === "/" || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const variant = variantFor(userType, pathname);
  const tabs = TABS[variant];

  return (
    <>
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-semibold text-apb">
          <span aria-hidden className="inline-block h-5 w-5 rounded-full bg-apb-accent" />
          Ahead of the <em className="not-italic text-apb-accent">Menu</em>
        </Link>

        {/* Path dropdown (same component for both variants) */}
        <div className="relative ml-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-apb-accent hover:text-apb"
          >
            {PATH_LABEL[variant]}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={open ? "rotate-180 transition" : "transition"}><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} />
              <ul className="absolute left-0 z-10 mt-2 min-w-[13rem] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                {tabs.map((t) => {
                  const active = pathname.startsWith(t.href);
                  return (
                    <li key={t.href}>
                      <Link
                        href={t.href}
                        onClick={() => setOpen(false)}
                        className={`block px-4 py-2.5 text-sm transition hover:bg-neutral-50 ${active ? "font-semibold text-apb" : "text-neutral-700"}`}
                      >
                        {t.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* Auth pill */}
        <div className="ml-auto flex items-center gap-2 text-sm">
          {isAuthenticated ? (
            <>
              <span className="hidden max-w-[12rem] truncate text-neutral-500 sm:inline">{email}</span>
              <button type="button" onClick={() => signOut()} className="rounded-full border border-neutral-200 px-3 py-1.5 font-medium text-neutral-700 transition hover:border-apb-accent hover:text-apb">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 font-medium text-neutral-700 transition hover:text-apb">Log in</Link>
              <Link href="/register" className="rounded-full bg-apb-accent px-4 py-1.5 font-semibold text-white transition hover:opacity-90">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
    {/* spacer so fixed nav doesn't overlap page content */}
    <div className="h-14" aria-hidden />
    </>
  );
}
