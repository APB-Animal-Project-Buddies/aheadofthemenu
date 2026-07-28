/**
 * POST /api/eat-this/dishes/[id]/edits
 *   - Signed-in user (Bearer): stores a PENDING suggested edit; the dish is untouched.
 *   - Admin (x-admin-secret): applies the proposed fields to the dish immediately.
 * Same endpoint, gated by who's asking — "users suggest, admins modify".
 * Body: { name?, description?, tags?, availability?, note? } (partial patch).
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { bearerToken, verifyNhostJwt } from "@/lib/jwt";
import { isAdmin } from "@/lib/admin";
import { validateDishEdit } from "@/lib/eat-this";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const input = validateDishEdit(body);
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

  const admin = isAdmin(req);
  let proposerId: string | null = null;
  if (!admin) {
    const caller = verifyNhostJwt(bearerToken(req.headers.get("authorization")));
    if (!caller) return NextResponse.json({ error: "Sign in to suggest an edit" }, { status: 401 });
    proposerId = caller.userId;
  }

  try {
    if (admin) {
      // Apply directly. `proposed` only holds the changed columns.
      const res = await graphql<{ update_restaurant_dishes: { affected_rows: number } }>(
        `mutation ($id: uuid!, $set: restaurant_dishes_set_input!) {
           update_restaurant_dishes(where: { id: { _eq: $id } }, _set: $set) { affected_rows }
         }`,
        { useAdminSecret: true, variables: { id: params.id, set: input.proposed } }
      );
      if (res.errors?.length) throw new Error(res.errors[0].message);
      if (!res.data?.update_restaurant_dishes?.affected_rows) {
        return NextResponse.json({ error: "Dish not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, applied: true });
    }

    const res = await graphql<{ insert_restaurant_dish_edits_one: { id: string } | null }>(
      `mutation ($obj: restaurant_dish_edits_insert_input!) {
         insert_restaurant_dish_edits_one(object: $obj) { id }
       }`,
      {
        useAdminSecret: true,
        variables: { obj: { dish_id: params.id, proposed: input.proposed, proposer_id: proposerId, note: input.note } },
      }
    );
    if (res.errors?.length) {
      if (/foreign key/i.test(res.errors[0].message)) {
        return NextResponse.json({ error: "Dish not found" }, { status: 404 });
      }
      throw new Error(res.errors[0].message);
    }
    return NextResponse.json({ ok: true, pending: true, id: res.data?.insert_restaurant_dish_edits_one?.id });
  } catch {
    return NextResponse.json({ error: "Couldn't submit your edit right now" }, { status: 502 });
  }
}
