/**
 * POST /api/agent/eat-this/vote   (API key, scope eat-this:vote)
 * Body { restaurantId, dishId, value: 1 | 0 | -1 | null, isLocal?, customizations?, orderType? }
 *
 * Requires BOTH ids. The browser route takes only the dish id, so a valid-but-
 * wrong UUID surfaces as an FK violation mapped to a generic 404; verifying the
 * dish actually belongs to the named restaurant makes an agent working from a
 * stale or hallucinated id fail loudly instead of silently upvoting someone
 * else's dish.
 *
 * Votes are written with source = 'agent'. Deliberately NOT via voter_kind:
 * that domain is CHECK (VALUE IN ('local','visitor')) and lib/eat-this.ts
 * buckets with `voter_kind === 'visitor' ? visitors : locals`, so a third value
 * would fall silently into the locals cohort — the one the UI presents as most
 * trustworthy. A separate column leaves the cohort maths untouched and makes a
 * bad run one DELETE.
 *
 * Idempotent by construction: upsert on (dish_id, user_id); null clears.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { fail, gate, readJson } from "@/lib/agent-http";
import { aggregateVotes, validateVote } from "@/lib/eat-this";
import { agentScore } from "@/lib/eat-this-agent";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const g = await gate(request, "eat-this:vote", "vote");
  if (!g.ok) return g.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const dishId = String(body?.dishId ?? "").trim();
  const restaurantId = String(body?.restaurantId ?? "").trim();
  if (!UUID_RE.test(dishId)) return fail("invalid_input", "A valid dishId is required.");
  if (!UUID_RE.test(restaurantId)) {
    return fail("invalid_input", "A valid restaurantId is required alongside dishId.");
  }

  const input = validateVote(body);
  if ("error" in input) return fail("invalid_input", input.error);

  try {
    const dish = await graphql<{ restaurant_dishes_by_pk: { id: string; restaurant_id: string } | null }>(
      `query ($id: uuid!) { restaurant_dishes_by_pk(id: $id) { id restaurant_id } }`,
      { useAdminSecret: true, variables: { id: dishId } }
    );
    if (dish.errors?.length) throw new Error(dish.errors[0].message);
    const row = dish.data?.restaurant_dishes_by_pk;
    if (!row) return fail("dish_not_found", "No dish with that id.");
    if (row.restaurant_id !== restaurantId) {
      return fail(
        "dish_not_in_restaurant",
        "That dish does not belong to the restaurant you named — re-resolve the ids before voting.",
        { actualRestaurantId: row.restaurant_id }
      );
    }

    if (input.value === null) {
      const del = await graphql(
        `mutation ($dish: uuid!, $user: uuid!) {
           delete_restaurant_dish_votes_by_pk(dish_id: $dish, user_id: $user) { dish_id }
         }`,
        { useAdminSecret: true, variables: { dish: dishId, user: g.caller.userId } }
      );
      if (del.errors?.length) throw new Error(del.errors[0].message);
    } else {
      const up = await graphql(
        `mutation ($obj: restaurant_dish_votes_insert_input!) {
           insert_restaurant_dish_votes_one(
             object: $obj,
             on_conflict: {
               constraint: restaurant_dish_votes_pkey,
               update_columns: [value, voter_kind, customizations, order_type, updated_at, source, api_key_id]
             }
           ) { dish_id }
         }`,
        {
          useAdminSecret: true,
          variables: {
            obj: {
              dish_id: dishId,
              user_id: g.caller.userId,
              value: input.value,
              voter_kind: input.voterKind,
              customizations: input.customizations,
              order_type: input.orderType,
              updated_at: new Date().toISOString(),
              source: "agent",
              api_key_id: g.caller.apiKeyId,
            },
          },
        }
      );
      if (up.errors?.length) throw new Error(up.errors[0].message);
    }

    const totals = await graphql<{
      restaurant_dish_votes: Array<{ value: number; voter_kind: string; customizations: string[] | null }>;
    }>(
      `query ($dish: uuid!) {
         restaurant_dish_votes(where: { dish_id: { _eq: $dish } }) { value voter_kind customizations }
       }`,
      { useAdminSecret: true, variables: { dish: dishId } }
    );
    if (totals.errors?.length) throw new Error(totals.errors[0].message);
    const rows = totals.data?.restaurant_dish_votes ?? [];
    const { locals, visitors } = aggregateVotes(rows);

    return NextResponse.json({
      ok: true,
      dishId,
      restaurantId,
      myVote: input.value,
      locals,
      visitors,
      // Same withholding rule as the UI: no percentage below the vote floor.
      score: agentScore(rows),
      rateLimitRemaining: g.remaining,
    });
  } catch (error) {
    console.error("agent vote failed:", error);
    return fail("upstream_unavailable", "Couldn't save that vote right now.");
  }
}
