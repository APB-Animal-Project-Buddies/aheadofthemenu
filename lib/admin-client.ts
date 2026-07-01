"use client";
// Client-side storage of the admin secret (entered once on /admin/edits), sent as
// the x-admin-secret header on admin-only requests. localStorage-based MVP.
const KEY = "apb-admin-secret";

export function getAdminSecret(): string {
  try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
}
export function setAdminSecret(v: string): void {
  try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
}
export function clearAdminSecret(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
export function hasAdminSecret(): boolean {
  return getAdminSecret().length > 0;
}
export function adminHeaders(): Record<string, string> {
  const s = getAdminSecret();
  return s ? { "x-admin-secret": s } : {};
}
