/**
 * lib/agent-limits.ts
 *
 * Per-key rate limiting for the agent write endpoints, counted in fixed hourly
 * windows in Postgres. No Redis: the counter is three columns and an upsert,
 * and the write volume is trivially small.
 *
 * Per-KEY rather than per-IP on purpose. One agent is one IP, and many agents
 * share cloud egress IPs, so an IP limit both under- and over-counts. The
 * Vercel WAF rule stays as a coarse per-IP layer on the public read endpoints.
 */
import type { GqlClient } from "@/lib/agent-keys";

export type LimitedEndpoint = "add_restaurant" | "add_dish" | "vote" | "comment";

/**
 * Starting limits per key per hour. These are guesses — revisit once there is
 * real traffic. Generous enough for honest seeding work, tight enough that a
 * runaway loop is capped within the hour.
 */
export const HOURLY_LIMITS: Record<LimitedEndpoint, number> = {
  add_restaurant: 10,
  add_dish: 30,
  vote: 60,
  comment: 20,
};

export type LimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfter: number };

async function defaultGql(): Promise<GqlClient> {
  const { graphql } = await import("@/lib/nhost");
  return graphql as GqlClient;
}

/** Start of the fixed hourly window containing `now`. */
export function windowStart(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setUTCMinutes(0, 0, 0);
  return d;
}

/** Seconds until the current window rolls over (never 0, so a client that
 * honours retryAfter always actually waits). */
export function secondsUntilNextWindow(now: Date = new Date()): number {
  const next = windowStart(now).getTime() + 3_600_000;
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

/**
 * Pure decision. `count` includes the call being decided, so a count equal to
 * the limit is the last allowed call.
 */
export function decide(count: number, limit: number, now: Date = new Date()): LimitResult {
  if (count > limit) return { allowed: false, retryAfter: secondsUntilNextWindow(now) };
  return { allowed: true, remaining: limit - count };
}

/**
 * Increments the counter for (key, endpoint, window) and decides on the result.
 *
 * Increment-then-check, not check-then-increment: the mutation returns the new
 * count atomically, so two concurrent calls cannot both read "one under the
 * limit" and both proceed. A rejected call still consumes a slot, which is the
 * right trade for an abuse control.
 *
 * The seed insert uses `update_columns: []` — Hasura's on_conflict can only set
 * columns to the *proposed* values, so listing `count` there would reset the
 * counter to 1 on every call and the limit would never trip. Empty means "do
 * nothing on conflict"; the `_inc` that follows does the actual counting. Both
 * fields are in one mutation, which Hasura runs sequentially in one transaction.
 */
export async function consume(
  apiKeyId: string,
  endpoint: LimitedEndpoint,
  gql?: GqlClient,
  now: Date = new Date()
): Promise<LimitResult> {
  const client = gql ?? (await defaultGql());
  const window = windowStart(now).toISOString();

  const res = await client<{
    bump: { returning: Array<{ count: number }> };
  }>(
    `mutation ($obj: api_key_usage_insert_input!, $key: uuid!, $endpoint: String!, $window: timestamptz!) {
       seed: insert_api_key_usage_one(
         object: $obj,
         on_conflict: { constraint: api_key_usage_pkey, update_columns: [] }
       ) { count }
       bump: update_api_key_usage(
         where: {
           api_key_id: { _eq: $key },
           endpoint: { _eq: $endpoint },
           window_start: { _eq: $window }
         },
         _inc: { count: 1 }
       ) { returning { count } }
     }`,
    {
      useAdminSecret: true,
      variables: {
        obj: { api_key_id: apiKeyId, endpoint, window_start: window, count: 0 },
        key: apiKeyId,
        endpoint,
        window,
      },
    }
  );
  if (res.errors?.length) throw new Error(res.errors[0].message);

  const count = res.data?.bump?.returning?.[0]?.count;
  // A missing count means the row vanished between insert and update (only
  // possible if the key was deleted mid-request). Fail closed.
  if (typeof count !== "number") return { allowed: false, retryAfter: secondsUntilNextWindow(now) };

  return decide(count, HOURLY_LIMITS[endpoint], now);
}
