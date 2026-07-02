"use client";

// Nhost sets avatarUrl to a Gravatar with default='blank' (a transparent image
// when the user has no Gravatar). So we render initials as the base and lay the
// Gravatar on top — a real Gravatar covers the initials; a blank one lets them
// show through. No error handling needed since 'blank' always loads.

function initialsFor(displayName?: string | null, email?: string | null): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.trim()?.[0] ?? "?").toUpperCase();
}

export function Avatar({
  email,
  displayName,
  avatarUrl,
  size = 32,
}: {
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className="relative inline-flex select-none items-center justify-center overflow-hidden rounded-full bg-apb font-semibold leading-none text-white"
    >
      {initialsFor(displayName, email)}
      {avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </span>
  );
}
