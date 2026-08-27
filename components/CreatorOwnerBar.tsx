"use client";

/**
 * Renders nothing unless the signed-in user is the one who owns this creator
 * profile — a quiet self-service nudge back to /profile, shown only to the
 * owner themselves, not to other visitors. Ownership is resolved by the
 * parent (CreatorProfileEditor) from the authenticated claims endpoint, so
 * the owner's user id never has to be on the public page.
 */
import Link from "next/link";

export function CreatorOwnerBar({ isOwner }: { isOwner: boolean }) {
  if (!isOwner) return null;

  return (
    <div className="mt-3 flex items-center gap-2 rounded-full border border-apb/20 bg-apb/5 px-3 py-1.5 text-xs font-medium text-apb">
      This is your profile
      <Link href="/profile" className="underline hover:no-underline">
        Manage it →
      </Link>
    </div>
  );
}
