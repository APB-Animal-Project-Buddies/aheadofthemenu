"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { ActiveDishesList } from "@/components/ActiveDishesList";
import { normalizeHandle } from "@/lib/handle";

export default function ActiveDishesPage() {
  const params = useParams<{ handle: string }>();
  const handle = normalizeHandle(String(params.handle ?? ""));
  const { handle: myHandle, userId } = useAuth();
  const isOwner = !!myHandle && normalizeHandle(myHandle) === handle;

  // Absolute URL of this page, for the shareable QR (origin is client-only).
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => {
    if (handle) setPageUrl(`${window.location.origin}/${handle}/active-dishes`);
  }, [handle]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/"
        aria-label="Home"
        className="mb-6 inline-flex items-center gap-3 rounded-2xl bg-apb px-6 py-4 text-xl font-semibold text-white shadow-sm transition hover:opacity-90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
          aria-hidden="true"
        >
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
        Home
      </Link>

      <h1 className="font-serif text-2xl font-semibold text-apb">@{handle}&rsquo;s active dishes</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Dishes open for review right now — each stays active for 24 hours.
      </p>

      <ActiveDishesList handle={handle} isOwner={isOwner} userId={userId} shareUrl={pageUrl} />
    </main>
  );
}
