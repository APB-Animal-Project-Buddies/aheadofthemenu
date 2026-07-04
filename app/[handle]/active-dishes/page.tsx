"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
      <h1 className="font-serif text-2xl font-semibold text-apb">@{handle}&rsquo;s active dishes</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Dishes open for review right now — each stays active for 24 hours.
      </p>

      <ActiveDishesList handle={handle} isOwner={isOwner} userId={userId} shareUrl={pageUrl} />
    </main>
  );
}
