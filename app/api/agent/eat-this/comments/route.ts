/**
 * POST /api/agent/eat-this/comments   (API key, scope eat-this:comment)
 * Body { restaurantId, dishId, body, visibility? }
 *
 * One comment per user per dish, matching the browser route — but returning
 * code "already_commented" so an agent stops instead of retrying a 409 forever.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { fail, gate, readJson } from "@/lib/agent-http";
import { validateComment } from "@/lib/eat-this";
import { dishUrl } from "@/lib/eat-this-agent";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const g = await gate(request, "eat-this:comment", "comment");
  if (!g.ok) return g.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.body;

  const dishId = String(payload?.dishId ?? "").trim();
  const restaurantId = String(payload?.restaurantId ?? "").trim();
  if (!UUID_RE.test(dishId)) return fail("invalid_input", "A valid dishId is required.");
  if (!UUID_RE.test(restaurantId)) {
    return fail("invalid_input", "A valid restaurantId is required alongside dishId.");
  }

  const input = validateComment(payload);
  if ("error" in input) return fail("invalid_input", input.error);

  try {
    const dish = await graphql<{ restaurant_dishes_by_pk: { restaurant_id: string } | null }>(
      `query ($id: uuid!) { restaurant_dishes_by_pk(id: $id) { restaurant_id } }`,
      { useAdminSecret: true, variables: { id: dishId } }
    );
    if (dish.errors?.length) throw new Error(dish.errors[0].message);
    const row = dish.data?.restaurant_dishes_by_pk;
    if (!row) return fail("dish_not_found", "No dish with that id.");
    if (row.restaurant_id !== restaurantId) {
      return fail(
        "dish_not_in_restaurant",
        "That dish does not belong to the restaurant you named.",
        { actualRestaurantId: row.restaurant_id }
      );
    }

    const existing = await graphql<{ restaurant_dish_comments: Array<{ id: string }> }>(
      `query ($dish: uuid!, $user: uuid!) {
         restaurant_dish_comments(where: { dish_id: { _eq: $dish }, user_id: { _eq: $user } }, limit: 1) { id }
       }`,
      { useAdminSecret: true, variables: { dish: dishId, user: g.caller.userId } }
    );
    if (existing.errors?.length) throw new Error(existing.errors[0].message);
    if (existing.data?.restaurant_dish_comments?.length) {
      return fail("already_commented", "This account has already commented on that dish.");
    }

    const res = await graphql<{
      insert_restaurant_dish_comments_one: { id: string; created_at: string } | null;
    }>(
      `mutation ($obj: restaurant_dish_comments_insert_input!) {
         insert_restaurant_dish_comments_one(object: $obj) { id created_at }
       }`,
      {
        useAdminSecret: true,
        variables: {
          obj: {
            dish_id: dishId,
            user_id: g.caller.userId,
            body: input.body,
            visibility: input.visibility,
            source: "agent",
            api_key_id: g.caller.apiKeyId,
          },
        },
      }
    );
    if (res.errors?.length) {
      const msg = res.errors[0].message;
      // The rl_dish_comments_user_uniq index backstops the check above.
      if (/unique|duplicate/i.test(msg)) {
        return fail("already_commented", "This account has already commented on that dish.");
      }
      throw new Error(msg);
    }

    const created = res.data?.insert_restaurant_dish_comments_one;
    return NextResponse.json({
      ok: true,
      commentId: created?.id ?? null,
      visibility: input.visibility,
      dishId,
      url: dishUrl(dishId),
      rateLimitRemaining: g.remaining,
    });
  } catch (error) {
    console.error("agent comment failed:", error);
    return fail("upstream_unavailable", "Couldn't post that comment right now.");
  }
}
