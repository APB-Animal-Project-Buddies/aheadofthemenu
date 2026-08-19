"use client";

/**
 * Renders nothing unless the signed-in user is the one who owns this creator
 * profile (owner_id match) — a quiet self-service nudge back to /profile,
 * shown only to the owner themselves, not to other visitors.
 */
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function CreatorOwnerBar({ ownerId }: { ownerId: string | null }) {
  const { userId } = useAuth();
  if (!ownerId || !userId || userId !== ownerId) return null;

  return (
    <div className="mt-3 flex items-center gap-2 rounded-full border border-apb/20 bg-apb/5 px-3 py-1.5 text-xs font-medium text-apb">
      This is your profile
      <Link href="/profile" className="underline hover:no-underline">
        Manage it →
      </Link>
    </div>
  );
}
