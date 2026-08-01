import { test, expect } from "bun:test";
import {
  HOURLY_LIMITS,
  consume,
  decide,
  secondsUntilNextWindow,
  windowStart,
  type LimitedEndpoint,
} from "./agent-limits";
import type { GqlClient } from "./agent-keys";

type Call = { query: string; variables: Record<string, unknown> | undefined };

/** Returns `count` from the `bump` field, mimicking the real mutation. */
function fakeGql(counts: number[]) {
  const calls: Call[] = [];
  let i = 0;
  const client = (async (query: string, options: any) => {
    calls.push({ query, variables: options?.variables });
    const c = counts[Math.min(i, counts.length - 1)];
    i += 1;
    return { data: { bump: { returning: [{ count: c }] } } };
  }) as unknown as GqlClient;
  return { client, calls };
}

const NOW = new Date("2026-07-26T12:30:45.123Z");

// --- windowStart -----------------------------------------------------------

test("windowStart zeroes minutes, seconds and milliseconds", () => {
  expect(windowStart(NOW).toISOString()).toBe("2026-07-26T12:00:00.000Z");
});

test("windowStart is idempotent", () => {
  const once = windowStart(NOW);
  expect(windowStart(once).toISOString()).toBe(once.toISOString());
});

test("windowStart does not mutate its argument", () => {
  const input = new Date(NOW);
  windowStart(input);
  expect(input.toISOString()).toBe(NOW.toISOString());
});

test("windowStart buckets by UTC hour, not local time", () => {
  // Both are the same UTC hour regardless of the machine's timezone.
  const a = windowStart(new Date("2026-07-26T12:00:00.000Z"));
  const b = windowStart(new Date("2026-07-26T12:59:59.999Z"));
  expect(a.toISOString()).toBe(b.toISOString());
});

test("windowStart puts adjacent hours in different buckets", () => {
  const a = windowStart(new Date("2026-07-26T12:59:59.999Z"));
  const b = windowStart(new Date("2026-07-26T13:00:00.000Z"));
  expect(a.toISOString()).not.toBe(b.toISOString());
});

test("windowStart rolls over correctly at a day boundary", () => {
  expect(windowStart(new Date("2026-07-26T23:59:59.999Z")).toISOString()).toBe(
    "2026-07-26T23:00:00.000Z"
  );
  expect(windowStart(new Date("2026-07-27T00:00:00.000Z")).toISOString()).toBe(
    "2026-07-27T00:00:00.000Z"
  );
});

// --- secondsUntilNextWindow ------------------------------------------------

test("secondsUntilNextWindow is a full hour at the top of the hour", () => {
  expect(secondsUntilNextWindow(new Date("2026-07-26T12:00:00.000Z"))).toBe(3600);
});

test("secondsUntilNextWindow shrinks through the window", () => {
  expect(secondsUntilNextWindow(new Date("2026-07-26T12:30:00.000Z"))).toBe(1800);
  expect(secondsUntilNextWindow(new Date("2026-07-26T12:59:00.000Z"))).toBe(60);
});

test("secondsUntilNextWindow never returns 0", () => {
  expect(secondsUntilNextWindow(new Date("2026-07-26T12:59:59.999Z"))).toBeGreaterThanOrEqual(1);
});

// --- decide ----------------------------------------------------------------

test("decide allows a count below the limit and reports what is left", () => {
  expect(decide(1, 10, NOW)).toEqual({ allowed: true, remaining: 9 });
});

test("decide allows the call that exactly reaches the limit", () => {
  expect(decide(10, 10, NOW)).toEqual({ allowed: true, remaining: 0 });
});

test("decide denies the first call past the limit", () => {
  const r = decide(11, 10, NOW);
  expect(r.allowed).toBe(false);
  if (!r.allowed) expect(r.retryAfter).toBe(1755);
});

test("decide denies everything when the limit is zero", () => {
  expect(decide(1, 0, NOW).allowed).toBe(false);
});

test("decide reports retryAfter matching the window remainder", () => {
  const now = new Date("2026-07-26T12:00:00.000Z");
  const r = decide(99, 1, now);
  if (!r.allowed) expect(r.retryAfter).toBe(3600);
});

// --- HOURLY_LIMITS ---------------------------------------------------------

test("every limited endpoint has a positive limit", () => {
  const endpoints: LimitedEndpoint[] = ["add_restaurant", "add_dish", "vote", "comment"];
  for (const e of endpoints) {
    expect(HOURLY_LIMITS[e]).toBeGreaterThan(0);
  }
});

test("restaurant creation is the most restricted write", () => {
  // It is the highest-risk write for catalog quality, so it must stay the
  // tightest limit; this fails loudly if someone loosens it casually.
  const others = [HOURLY_LIMITS.add_dish, HOURLY_LIMITS.vote, HOURLY_LIMITS.comment];
  for (const l of others) expect(HOURLY_LIMITS.add_restaurant).toBeLessThan(l);
});

// --- consume ---------------------------------------------------------------

test("consume allows the first call in a window", async () => {
  const { client } = fakeGql([1]);
  expect(await consume("user-1", "vote", client, NOW)).toEqual({
    allowed: true,
    remaining: HOURLY_LIMITS.vote - 1,
  });
});

test("consume denies once the returned count passes the limit", async () => {
  const { client } = fakeGql([HOURLY_LIMITS.vote + 1]);
  const r = await consume("user-1", "vote", client, NOW);
  expect(r.allowed).toBe(false);
});

test("consume allows the call that exactly reaches the limit", async () => {
  const { client } = fakeGql([HOURLY_LIMITS.comment]);
  expect(await consume("user-1", "comment", client, NOW)).toEqual({
    allowed: true,
    remaining: 0,
  });
});

test("consume applies the per-endpoint limit, not a shared one", async () => {
  const at = HOURLY_LIMITS.add_restaurant + 1; // over for restaurants, under for votes
  const a = await consume("user-1", "add_restaurant", fakeGql([at]).client, NOW);
  const b = await consume("user-1", "vote", fakeGql([at]).client, NOW);
  expect(a.allowed).toBe(false);
  expect(b.allowed).toBe(true);
});

test("consume scopes the counter to account, endpoint and window", async () => {
  const { client, calls } = fakeGql([1]);
  await consume("user-7", "add_dish", client, NOW);
  expect(calls[0].variables).toMatchObject({
    user: "user-7",
    endpoint: "add_dish",
    window: "2026-07-26T12:00:00.000Z",
    obj: {
      user_id: "user-7",
      endpoint: "add_dish",
      window_start: "2026-07-26T12:00:00.000Z",
      count: 0,
    },
  });
});

test("consume counts two different keys on one account against one quota", async () => {
  // The whole point of the per-account axis: the counter must not be keyed on
  // anything key-specific, or minting a second key doubles the ceiling.
  const { client, calls } = fakeGql([1, 2]);
  await consume("user-9", "vote", client, NOW);
  await consume("user-9", "vote", client, NOW);

  const [first, second] = calls;
  expect((first.variables as any).user).toBe("user-9");
  expect((second.variables as any).user).toBe("user-9");
  // Same row both times, so the second call sees the first call's increment.
  expect((first.variables as any).obj).toEqual((second.variables as any).obj);
  expect(first.query).not.toContain("api_key_id");
});

test("consume seeds with count 0 and increments separately", async () => {
  // Regression guard: listing `count` in update_columns would reset the counter
  // to the proposed value on every call, so the limit would never trip.
  const { client, calls } = fakeGql([1]);
  await consume("user-1", "vote", client, NOW);
  expect(calls[0].query).toContain("update_columns: []");
  expect(calls[0].query).toContain("_inc: { count: 1 }");
  expect((calls[0].variables as any).obj.count).toBe(0);
});

test("consume issues a single round trip", async () => {
  const { client, calls } = fakeGql([1]);
  await consume("user-1", "vote", client, NOW);
  expect(calls).toHaveLength(1);
});

test("consume throws on upstream error", async () => {
  const client = (async () => ({ errors: [{ message: "deadlock detected" }] })) as unknown as GqlClient;
  await expect(consume("user-1", "vote", client, NOW)).rejects.toThrow("deadlock detected");
});

test("consume fails closed when no count comes back", async () => {
  const client = (async () => ({ data: { bump: { returning: [] } } })) as unknown as GqlClient;
  const r = await consume("user-1", "vote", client, NOW);
  expect(r.allowed).toBe(false);
});

test("consume fails closed when the response shape is unexpected", async () => {
  const client = (async () => ({ data: {} })) as unknown as GqlClient;
  const r = await consume("user-1", "vote", client, NOW);
  expect(r.allowed).toBe(false);
});
