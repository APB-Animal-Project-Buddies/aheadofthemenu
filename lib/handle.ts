/**
 * lib/handle.ts
 * Shared handle (username) rules — used by the forms (client) AND the
 * availability/update API (server), so validation can't drift between them.
 */

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;

/** Lowercase + trim; the canonical stored form. */
export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Returns an error message if the handle is invalid, or null if it's OK.
 * Rules: start with a letter; 3–20 chars; lowercase letters, digits, _ or -.
 */
export function validateHandle(raw: string): string | null {
  const h = normalizeHandle(raw);
  if (!h) return "Handle is required";
  if (h.length < HANDLE_MIN) return `Handle must be at least ${HANDLE_MIN} characters`;
  if (h.length > HANDLE_MAX) return `Handle must be at most ${HANDLE_MAX} characters`;
  if (!/^[a-z]/.test(h)) return "Handle must start with a letter";
  if (!/^[a-z0-9_-]+$/.test(h)) return "Use only lowercase letters, numbers, _ or -";
  return null;
}
