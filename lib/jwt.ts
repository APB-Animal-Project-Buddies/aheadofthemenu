/**
 * lib/jwt.ts
 *
 * Server-side verification of Nhost access tokens (HS256). We decode the token
 * ourselves (base64url) AND verify the signature — decoding alone is NOT auth,
 * since claims are attacker-controlled without a signature check.
 *
 * Requires NHOST_JWT_SECRET to be set to the same HS256 key as the Nhost
 * project's HASURA_GRAPHQL_JWT_SECRET. If it's missing we fail CLOSED (return
 * null), so a misconfigured deploy denies rather than trusts.
 */
import crypto from "node:crypto";

const HASURA_CLAIMS_NS = "https://hasura.io/jwt/claims";

export type VerifiedToken = { userId: string; roles: string[] };

/** Nhost stores the secret either as a raw key or as `{"type":"HS256","key":"…"}`. */
function resolveKey(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.key === "string") return parsed.key;
  } catch {
    /* not JSON — treat as the raw key */
  }
  return raw;
}

/**
 * Verifies an Nhost access token and returns the caller's user id + roles, or
 * null if the token is absent, malformed, expired, or the signature is invalid.
 */
export function verifyNhostJwt(token: string | null | undefined): VerifiedToken | null {
  const secretEnv = process.env.NHOST_JWT_SECRET;
  if (!secretEnv || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  // 1) Verify the HS256 signature over `header.payload` (constant-time compare).
  const expected = crypto
    .createHmac("sha256", resolveKey(secretEnv))
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signatureB64, "base64url");
  } catch {
    return null;
  }
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return null;
  }

  // 2) Decode the claims only after the signature checks out.
  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  // 3) Reject expired tokens.
  if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) return null;

  // 4) Pull the user id from the Hasura claims (fall back to the standard `sub`).
  const hasura = (claims[HASURA_CLAIMS_NS] as Record<string, unknown> | undefined) ?? {};
  const userId =
    (typeof hasura["x-hasura-user-id"] === "string" ? (hasura["x-hasura-user-id"] as string) : null) ??
    (typeof claims.sub === "string" ? (claims.sub as string) : null);
  if (!userId) return null;

  const roles = Array.isArray(hasura["x-hasura-allowed-roles"])
    ? (hasura["x-hasura-allowed-roles"] as string[])
    : [];
  return { userId, roles };
}

/** Extracts a Bearer token from an Authorization header value. */
export function bearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  return authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice(7) : null;
}
