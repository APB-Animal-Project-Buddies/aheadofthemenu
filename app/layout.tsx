import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { SiteNav } from "@/components/SiteNav";
import { SITE_URL } from "@/lib/site-url";

/**
 * Site-wide metadata.
 *
 * This MUST stay in the metadata API rather than a hardcoded <title> in <head>:
 * a literal tag renders before the one Next generates, so every page shipped two
 * <title> elements and crawlers took the first. That silently defeated every
 * generateMetadata in the app, including the creator pages'.
 *
 * `template` wraps page titles; a page wanting full control can return
 * `title: { absolute: "…" }`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ahead of the Menu",
    template: "%s — Ahead of the Menu",
  },
  description:
    "Plant-based recipes, creators, and dishes you can actually order — from Animal Project Buddies.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Title and icon come from the `metadata` export above — a literal
            <title> here renders FIRST and wins over every page's own, which is
            what shipped two <title> elements site-wide. Re-added by the
            icon-and-title merge; do not put it back. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <SiteNav />
          {children}
          {modal}
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
