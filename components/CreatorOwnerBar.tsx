"use client";

/**
 * Renders nothing unless the signed-in user is the one who owns this creator
 * profile — a quiet self-service nudge back to /profile, shown only to the
 * owner themselves, not to other visitors. Ownership is resolved by the
 * parent (CreatorProfileEditor) from the authenticated claims endpoint, so
 * the owner's user id never has to be on the public page.
 */
import Link from "next/link";

export function CreatorOwnerBar({
  isOwner,
  previewPublic,
  onTogglePreview,
}: {
  isOwner: boolean;
  /** When set, renders a switch that flips the page between the editor and exactly what visitors see. */
  previewPublic?: boolean;
  onTogglePreview?: (next: boolean) => void;
}) {
  if (!isOwner) return null;
  const hasSwitch = typeof previewPublic === "boolean" && !!onTogglePreview;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-apb/20 bg-apb/5 px-4 py-2.5 text-sm font-medium text-apb">
      <span className="flex items-center gap-2">
        This is your profile
        <Link href="/profile" className="text-xs underline hover:no-underline">
          Manage it →
        </Link>
      </span>
      {hasSwitch ? (
        <label className="flex cursor-pointer select-none items-center gap-2 text-xs">
          <span className={previewPublic ? "text-neutral-500" : ""}>Editing</span>
          <button
            type="button"
            role="switch"
            aria-checked={previewPublic}
            aria-label="See public version"
            onClick={() => onTogglePreview(!previewPublic)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${previewPublic ? "bg-apb" : "bg-neutral-300"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${previewPublic ? "left-[22px]" : "left-0.5"}`}
            />
          </button>
          <span className={previewPublic ? "" : "text-neutral-500"}>See public version</span>
        </label>
      ) : null}
    </div>
  );
}
