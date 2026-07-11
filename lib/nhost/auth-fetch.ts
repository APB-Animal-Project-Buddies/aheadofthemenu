/**
 * lib/nhost/auth-fetch.ts
 *
 * Authenticated fetch helper for calls to our OWN Next API routes.
 *
 * The Nhost SDK only auto-refreshes JWTs on requests made through its service
 * clients (nhost.graphql / storage / functions / auth). Our app talks to its
 * own /api/* routes with a plain fetch + `Authorization: Bearer <token>`, which
 * bypasses that refresh middleware — so a token read straight out of React
 * state goes stale after the access-token lifetime and the route rejects it
 * (401) as an apparent "session timeout".
 *
 * `authFetch` closes that gap: it refreshes the token before use (a no-op while
 * the token is still comfortably valid) and, as a fallback, force-refreshes and
 * retries once if the server still answers 401.
 */
import { getNhost } from "@/lib/nhost/client";

/** Refresh this many seconds ahead of expiry; matches the SDK's own default. */
const REFRESH_MARGIN_SECONDS = 60;

/**
 * Returns a valid access token, refreshing first if the current one is within
 * `marginSeconds` of expiry (or already expired). Returns null when there is no
 * session at all. Never throws — a failed refresh falls back to the stored
 * token (which may be null), letting the caller's request surface the real 401.
 */
export async function getAccessToken(
  marginSeconds: number = REFRESH_MARGIN_SECONDS
): Promise<string | null> {
  const nhost = getNhost();
  try {
    // No network call while the token is still valid beyond the margin; uses
    // the refresh token to mint a new one otherwise.
    const session = await nhost.refreshSession(marginSeconds);
    return session?.accessToken ?? null;
  } catch {
    return nhost.getUserSession()?.accessToken ?? null;
  }
}

/**
 * fetch() wrapper for authenticated calls to our own API routes. Attaches a
 * fresh Bearer token and, if the server still rejects it (401), force-refreshes
 * once and retries. Bodies must be re-sendable (strings/JSON, not one-shot
 * streams) for the retry — every current caller passes JSON, which is fine.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const send = (token: string | null): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };

  const res = await send(await getAccessToken());
  // A 401 from our routes means verifyNhostJwt rejected the token before doing
  // any work, so retrying a POST/DELETE is safe (no partial effect occurred).
  if (res.status !== 401) return res;

  let refreshed: string | null = null;
  try {
    refreshed = (await getNhost().refreshSession(0))?.accessToken ?? null;
  } catch {
    refreshed = null;
  }
  if (!refreshed) return res; // nothing better to try — hand back the 401
  return send(refreshed);
}
