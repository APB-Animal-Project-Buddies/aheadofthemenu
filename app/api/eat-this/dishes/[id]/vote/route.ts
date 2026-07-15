/**
 * PUT /api/eat-this/dishes/[id]/vote  (Bearer auth required)
 * Body { value: 1 | -1 | null, isLocal?: boolean } — isLocal defaults true.
 * Upserts on (dish_id, user_id); null deletes. Idempotent by construction.
 * Returns fresh per-cohort totals for optimistic-UI reconciliation.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { bearerToken, verifyNhostJwt } from "@/lib/jwt";
import { aggregateVotes, validateVote } from "@/lib/reverse-lookup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const token = bearerToken(request.headers.get("authorization"));
  const caller = verifyNhostJwt(token);
  if (!caller) return NextResponse.json({ error: "Sign in to vote" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const input = validateVote(body);
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

  try {
    if (input.value === null) {
      const res = await graphql(
        `mutation ($dish: uuid!, $user: uuid!) {
           delete_restaurant_dish_votes_by_pk(dish_id: $dish, user_id: $user) { dish_id }
         }`,
        { useAdminSecret: true, variables: { dish: params.id, user: caller.userId } }
      );
      if (res.errors?.length) throw new Error(res.errors[0].message);
    } else {
      const res = await graphql(
        `mutation ($obj: restaurant_dish_votes_insert_input!) {
           insert_restaurant_dish_votes_one(
             object: $obj,
             on_conflict: { constraint: restaurant_dish_votes_pkey, update_columns: [value, voter_kind, updated_at] }
           ) { dish_id }
         }`,
        {
          useAdminSecret: true,
          variables: {
            obj: {
              dish_id: params.id, user_id: caller.userId, value: input.value,
              voter_kind: input.voterKind, updated_at: new Date().toISOString(),
            },
          },
        }
      );
      if (res.errors?.length) {
        // FK violation = dish id doesn't exist (or was removed).
        if (/foreign key/i.test(res.errors[0].message)) {
          return NextResponse.json({ error: "Dish not found" }, { status: 404 });
        }
        throw new Error(res.errors[0].message);
      }
    }

    const totals = await graphql<{ restaurant_dish_votes: Array<{ value: number; voter_kind: string }> }>(
      `query ($dish: uuid!) {
         restaurant_dish_votes(where: { dish_id: { _eq: $dish } }) { value voter_kind }
       }`,
      { useAdminSecret: true, variables: { dish: params.id } }
    );
    const { locals, visitors } = aggregateVotes(totals.data?.restaurant_dish_votes ?? []);
    return NextResponse.json({
      ok: true, locals, visitors,
      myVote: input.value === null ? null : { value: input.value, isLocal: input.voterKind !== "visitor" },
    });
  } catch {
    return NextResponse.json({ error: "Couldn't save your vote right now" }, { status: 502 });
  }
}
