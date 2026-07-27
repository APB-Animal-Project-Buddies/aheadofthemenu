/**
 * lib/agent-keys.ts
 *
 * Long-lived, scoped, revocable API keys so an AI agent can act as a specific
 * AOTM user. Nhost access tokens expire in 15 minutes and refresh only through
 * the browser SDK (nhost.toml: auth.session.accessToken.expiresIn = 900), so an
 * agent can never hold one.
 *
 * This does NOT make us an OAuth authorization server. There is no third party
 * in the trust chain: a signed-in user mints a key for themselves on their own
 * profile page, and we verify it the way any resource server would — hash, look
 * up, check scopes. Adding OAuth later means a third verifier returning the
 * same VerifiedToken shape; no handler below this layer changes.
 *
 * The GraphQL client is injected (defaulting to a lazily-imported lib/nhost) so
 * the whole module is testable without network or environment.
 */
import crypto from "node:crypto";
import type { VerifiedToken } from "@/lib/jwt";

// Scope vocabulary lives in its own module so the client-side key manager can
// import it without pulling node:crypto into the browser bundle. Re-exported
// here so server callers have a single import.
export {
  ALL_SCOPES,
  DEFAULT_SCOPES,
  hasScope,
  isScope,
  sanitizeScopes,
  type AgentScope,
} from "@/lib/agent-scopes";

export const KEY_PREFIX = "aotm_ak_";

export type AgentCaller = VerifiedToken & {
  apiKeyId: string;
  scopes: string[];
};

/** A key row as stored. `key_hash` is never selected outside this module. */
export type ApiKeyRow = {
  id: string;
  user_id: string;
  scopes: string[] | null;
  expires_at: string | null;
  revoked_at: string | null;
};

/** Minimal structural shape of lib/nhost's `graphql`, so tests can inject one. */
export type GqlClient = <T>(
  query: string,
  options: { variables?: Record<string, unknown>; useAdminSecret?: boolean }
) => Promise<{ data?: T; errors?: Array<{ message: string }> }>;

/** Imported lazily: lib/nhost throws at module scope when NHOST_SUBDOMAIN and
 * NHOST_REGION are unset, which would make importing this file fail in tests. */
async function defaultGql(): Promise<GqlClient> {
  const { graphql } = await import("@/lib/nhost");
  return graphql as GqlClient;
}

/** 32 bytes of CSPRNG output, base64url, prefixed so it is greppable in logs
 * and recognisable when a user pastes it somewhere it does not belong. */
export function generateKey(): string {
  return KEY_PREFIX + crypto.randomBytes(32).toString("base64url");
}

/**
 * SHA-256, not bcrypt. The token is full-entropy random, so there is no
 * dictionary to stretch against, and a cheap hash keeps lookup an indexed
 * equality query rather than scan-and-compare — which is also why there is no
 * timing-comparison concern here.
 */
export function hashKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function looksLikeAgentKey(raw: string | null | undefined): raw is string {
  return typeof raw === "string" && raw.startsWith(KEY_PREFIX) && raw.length > KEY_PREFIX.length;
}

/** Pure usability check, split from the lookup so it is testable on its own. */
export function keyIsUsable(row: ApiKeyRow, now: Date = new Date()): boolean {
  if (row.revoked_at) return false;
  if (row.expires_at && new Date(row.expires_at).getTime() <= now.getTime()) return false;
  return true;
}

/**
 * Verifies a raw bearer token against api_keys. Returns null for absent,
 * malformed, unknown, revoked, and expired keys alike — a caller must not be
 * able to tell those cases apart.
 *
 * Throws only on upstream failure, so a Nhost outage surfaces as 502 rather
 * than masquerading as an auth failure.
 */
export async function verifyAgentKey(
  raw: string | null | undefined,
  gql?: GqlClient,
  now: Date = new Date()
): Promise<AgentCaller | null> {
  if (!looksLikeAgentKey(raw)) return null;
  const client = gql ?? (await defaultGql());

  const res = await client<{ api_keys: ApiKeyRow[] }>(
    `query ($hash: String!) {
       api_keys(where: { key_hash: { _eq: $hash } }, limit: 1) {
         id user_id scopes expires_at revoked_at
       }
     }`,
    { useAdminSecret: true, variables: { hash: hashKey(raw) } }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);

  const row = res.data?.api_keys?.[0];
  if (!row || !keyIsUsable(row, now)) return null;

  // Best-effort last-used stamp; a failure here must never fail the request.
  void touchKey(row.id, client, now).catch(() => {});

  return {
    userId: row.user_id,
    roles: ["user"],
    apiKeyId: row.id,
    scopes: row.scopes ?? [],
  };
}

export async function touchKey(id: string, gql: GqlClient, now: Date = new Date()): Promise<void> {
  await gql(
    `mutation ($id: uuid!, $at: timestamptz!) {
       update_api_keys_by_pk(pk_columns: { id: $id }, _set: { last_used_at: $at }) { id }
     }`,
    { useAdminSecret: true, variables: { id, at: now.toISOString() } }
  );
}
