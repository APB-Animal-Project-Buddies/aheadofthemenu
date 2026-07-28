import { test, expect } from "bun:test";
import crypto from "node:crypto";
import {
  ALL_SCOPES,
  DEFAULT_SCOPES,
  KEY_PREFIX,
  generateKey,
  hasScope,
  hashKey,
  isScope,
  keyIsUsable,
  looksLikeAgentKey,
  sanitizeScopes,
  touchKey,
  verifyAgentKey,
  type ApiKeyRow,
  type GqlClient,
} from "./agent-keys";

// --- test doubles ----------------------------------------------------------

type Call = { query: string; variables: Record<string, unknown> | undefined };

/** Records calls and replays queued responses in order; the last queued
 * response repeats once the queue is exhausted. */
function fakeGql(responses: Array<Record<string, unknown>>) {
  const calls: Call[] = [];
  let i = 0;
  const client = (async (query: string, options: any) => {
    calls.push({ query, variables: options?.variables });
    const res = responses[Math.min(i, responses.length - 1)];
    i += 1;
    return res;
  }) as unknown as GqlClient;
  return { client, calls };
}

const row = (over: Partial<ApiKeyRow> = {}): ApiKeyRow => ({
  id: "key-1",
  user_id: "user-1",
  scopes: ["eat-this:read"],
  expires_at: null,
  revoked_at: null,
  ...over,
});

const NOW = new Date("2026-07-26T12:30:00.000Z");

// --- generateKey -----------------------------------------------------------

test("generateKey is prefixed and long enough to be unguessable", () => {
  const k = generateKey();
  expect(k.startsWith(KEY_PREFIX)).toBe(true);
  // 32 bytes base64url => 43 chars, no padding.
  expect(k.slice(KEY_PREFIX.length)).toHaveLength(43);
});

test("generateKey emits only base64url characters after the prefix", () => {
  for (let i = 0; i < 50; i++) {
    expect(generateKey().slice(KEY_PREFIX.length)).toMatch(/^[A-Za-z0-9_-]+$/);
  }
});

test("generateKey never repeats", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 1000; i++) seen.add(generateKey());
  expect(seen.size).toBe(1000);
});

// --- hashKey ---------------------------------------------------------------

test("hashKey is deterministic and 64 hex chars", () => {
  const k = generateKey();
  expect(hashKey(k)).toBe(hashKey(k));
  expect(hashKey(k)).toMatch(/^[0-9a-f]{64}$/);
});

test("hashKey matches a known SHA-256 vector", () => {
  // Guards against someone swapping the algorithm without noticing.
  expect(hashKey("abc")).toBe(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
});

test("hashKey differs for inputs one character apart", () => {
  expect(hashKey("aotm_ak_aaa")).not.toBe(hashKey("aotm_ak_aab"));
});

test("hashKey agrees with an independent SHA-256 of the same input", () => {
  const k = generateKey();
  const expected = crypto.createHash("sha256").update(k).digest("hex");
  expect(hashKey(k)).toBe(expected);
});

// --- looksLikeAgentKey -----------------------------------------------------

test.each([
  ["aotm_ak_abc", true],
  [KEY_PREFIX, false], // prefix with no body
  ["aotm_ak", false],
  ["nhst_agt_abc", false],
  ["Bearer aotm_ak_abc", false],
  ["", false],
  ["  aotm_ak_abc", false],
] as Array<[string, boolean]>)("looksLikeAgentKey(%p) === %p", (input: string, expected: boolean) => {
  expect(looksLikeAgentKey(input)).toBe(expected);
});

test("looksLikeAgentKey rejects null and undefined", () => {
  expect(looksLikeAgentKey(null)).toBe(false);
  expect(looksLikeAgentKey(undefined)).toBe(false);
});

// --- scopes ----------------------------------------------------------------

test("isScope accepts every declared scope", () => {
  for (const s of ALL_SCOPES) expect(isScope(s)).toBe(true);
});

test.each(["eat-this:admin", "read", "", "EAT-THIS:READ"])(
  "isScope rejects unknown string %p",
  (s: string) => {
    expect(isScope(s)).toBe(false);
  }
);

test("isScope rejects non-strings", () => {
  for (const v of [null, undefined, 1, {}, [], true]) expect(isScope(v)).toBe(false);
});

test("sanitizeScopes keeps known scopes in canonical order", () => {
  expect(sanitizeScopes(["eat-this:vote", "eat-this:read"])).toEqual([
    "eat-this:read",
    "eat-this:vote",
  ]);
});

test("sanitizeScopes dedupes", () => {
  expect(sanitizeScopes(["eat-this:read", "eat-this:read"])).toEqual(["eat-this:read"]);
});

test("sanitizeScopes drops unknown entries rather than rejecting the whole list", () => {
  expect(sanitizeScopes(["eat-this:read", "eat-this:admin", 42, null])).toEqual([
    "eat-this:read",
  ]);
});

test("sanitizeScopes returns [] for non-arrays and empty input", () => {
  for (const v of [null, undefined, "eat-this:read", {}, 5]) {
    expect(sanitizeScopes(v)).toEqual([]);
  }
  expect(sanitizeScopes([])).toEqual([]);
});

test("DEFAULT_SCOPES excludes voting", () => {
  expect(DEFAULT_SCOPES).not.toContain("eat-this:vote");
});

test("DEFAULT_SCOPES are all real scopes", () => {
  for (const s of DEFAULT_SCOPES) expect(isScope(s)).toBe(true);
});

test("hasScope is exact, not prefix or substring matching", () => {
  const caller = { scopes: ["eat-this:read"] };
  expect(hasScope(caller, "eat-this:read")).toBe(true);
  expect(hasScope(caller, "eat-this:write")).toBe(false);
  expect(hasScope({ scopes: [] }, "eat-this:read")).toBe(false);
});

// --- keyIsUsable -----------------------------------------------------------

test("keyIsUsable accepts an active key with no expiry", () => {
  expect(keyIsUsable(row(), NOW)).toBe(true);
});

test("keyIsUsable rejects a revoked key", () => {
  expect(keyIsUsable(row({ revoked_at: "2026-07-01T00:00:00Z" }), NOW)).toBe(false);
});

test("keyIsUsable rejects a revoked key even if it has not expired", () => {
  const r = row({ revoked_at: "2026-07-01T00:00:00Z", expires_at: "2030-01-01T00:00:00Z" });
  expect(keyIsUsable(r, NOW)).toBe(false);
});

test("keyIsUsable rejects an expired key", () => {
  expect(keyIsUsable(row({ expires_at: "2026-07-25T00:00:00Z" }), NOW)).toBe(false);
});

test("keyIsUsable accepts a key expiring in the future", () => {
  expect(keyIsUsable(row({ expires_at: "2026-08-01T00:00:00Z" }), NOW)).toBe(true);
});

test("keyIsUsable treats expiry exactly at now as expired", () => {
  expect(keyIsUsable(row({ expires_at: NOW.toISOString() }), NOW)).toBe(false);
});

test("keyIsUsable accepts a key expiring one millisecond from now", () => {
  const r = row({ expires_at: new Date(NOW.getTime() + 1).toISOString() });
  expect(keyIsUsable(r, NOW)).toBe(true);
});

// --- verifyAgentKey --------------------------------------------------------

test("verifyAgentKey returns null without querying for a malformed token", async () => {
  const { client, calls } = fakeGql([{ data: { api_keys: [row()] } }]);
  for (const bad of [null, undefined, "", "Bearer x", "nhst_agt_x", KEY_PREFIX]) {
    expect(await verifyAgentKey(bad as string, client, NOW)).toBeNull();
  }
  expect(calls).toHaveLength(0);
});

test("verifyAgentKey looks the key up by its hash, never by the raw value", async () => {
  const key = generateKey();
  const { client, calls } = fakeGql([{ data: { api_keys: [row()] } }, { data: {} }]);
  await verifyAgentKey(key, client, NOW);
  expect(calls[0].variables).toEqual({ hash: hashKey(key) });
  expect(JSON.stringify(calls[0])).not.toContain(key);
});

test("verifyAgentKey returns the caller for a valid key", async () => {
  const { client } = fakeGql([
    { data: { api_keys: [row({ scopes: ["eat-this:read", "eat-this:vote"] })] } },
    { data: {} },
  ]);
  const caller = await verifyAgentKey(generateKey(), client, NOW);
  expect(caller).toMatchObject({
    userId: "user-1",
    apiKeyId: "key-1",
    scopes: ["eat-this:read", "eat-this:vote"],
  });
});

test("verifyAgentKey coerces null scopes to an empty array", async () => {
  const { client } = fakeGql([{ data: { api_keys: [row({ scopes: null })] } }, { data: {} }]);
  const caller = await verifyAgentKey(generateKey(), client, NOW);
  expect(caller?.scopes).toEqual([]);
});

test.each([
  ["unknown", { data: { api_keys: [] } }],
  ["revoked", { data: { api_keys: [row({ revoked_at: "2026-07-01T00:00:00Z" })] } }],
  ["expired", { data: { api_keys: [row({ expires_at: "2026-07-01T00:00:00Z" })] } }],
] as Array<[string, Record<string, unknown>]>)(
  "verifyAgentKey returns null for a %s key",
  async (_label: string, response: Record<string, unknown>) => {
    const { client } = fakeGql([response]);
    expect(await verifyAgentKey(generateKey(), client, NOW)).toBeNull();
  }
);

test("verifyAgentKey throws on upstream error rather than reporting bad auth", async () => {
  const { client } = fakeGql([{ errors: [{ message: "connection refused" }] }]);
  await expect(verifyAgentKey(generateKey(), client, NOW)).rejects.toThrow("connection refused");
});

test("verifyAgentKey stamps last_used_at for a valid key", async () => {
  const { client, calls } = fakeGql([{ data: { api_keys: [row()] } }, { data: {} }]);
  await verifyAgentKey(generateKey(), client, NOW);
  await Promise.resolve(); // let the fire-and-forget touch settle
  expect(calls[1].query).toContain("update_api_keys_by_pk");
  expect(calls[1].variables).toEqual({ id: "key-1", at: NOW.toISOString() });
});

test("verifyAgentKey still succeeds when the last_used_at stamp fails", async () => {
  let n = 0;
  const client = (async (_q: string, _o: any) => {
    n += 1;
    if (n === 1) return { data: { api_keys: [row()] } };
    throw new Error("write failed");
  }) as unknown as GqlClient;

  const caller = await verifyAgentKey(generateKey(), client, NOW);
  await Promise.resolve();
  expect(caller?.userId).toBe("user-1");
});

test("verifyAgentKey does not stamp last_used_at for an invalid key", async () => {
  const { client, calls } = fakeGql([{ data: { api_keys: [] } }]);
  await verifyAgentKey(generateKey(), client, NOW);
  await Promise.resolve();
  expect(calls).toHaveLength(1);
});

// --- touchKey --------------------------------------------------------------

test("touchKey issues a single scoped update", async () => {
  const { client, calls } = fakeGql([{ data: {} }]);
  await touchKey("key-9", client, NOW);
  expect(calls).toHaveLength(1);
  expect(calls[0].variables).toEqual({ id: "key-9", at: NOW.toISOString() });
});
