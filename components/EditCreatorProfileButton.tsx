"use client";

/**
 * The big "Edit my Creator Profile" call to action at the top of /profile.
 * Renders only once the signed-in user owns a creator page (same
 * GET /api/creators/claims the "Your creator page" section uses).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/nhost/auth-fetch";

export function EditCreatorProfileButton({ className = "" }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    authFetch("/api/creators/claims")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setSlug(d?.owned?.slug ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!slug) return null;
  return (
    <Link
      href={`/creators/${slug}`}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-apb px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:opacity-90 ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      Edit my Creator Profile
    </Link>
  );
}
