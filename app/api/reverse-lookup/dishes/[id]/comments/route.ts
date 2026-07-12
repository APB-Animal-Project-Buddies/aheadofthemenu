/**
 * POST   /api/reverse-lookup/dishes/[id]/comments  (Bearer) { body, visibility }
 * DELETE /api/reverse-lookup/dishes/[id]/comments  (Bearer) { id }  (author only)
 *
 * A flat comment on a dish. `visibility` is 'public' (shown on the card by the
 * catalog GET) or 'private_to_restaurant' (a private message — stored, never
 * surfaced publicly; delivery to the restaurant is a future no-op).
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { bearerToken, verifyNhostJwt } from "@/lib/jwt";
import { validateComment } from "@/lib/reverse-lookup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const input = validateComment(body);
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

  try {
    // One comment per user per dish (any visibility). The UI hides the input once
    // you've commented; this is the authoritative guard.
    const existing = await graphql<{ restaurant_dish_comments: Array<{ id: string }> }>(
      `query ($dish: uuid!, $user: uuid!) {
         restaurant_dish_comments(where: { dish_id: { _eq: $dish }, user_id: { _eq: $user } }, limit: 1) { id }
       }`,
      { useAdminSecret: true, variables: { dish: params.id, user: caller.userId } }
    );
    if (existing.errors?.length) throw new Error(existing.errors[0].message);
    if (existing.data?.restaurant_dish_comments?.length) {
      return NextResponse.json({ error: "You've already commented on this dish." }, { status: 409 });
    }

    const res = await graphql<{ insert_restaurant_dish_comments_one: { id: string; created_at: string } | null }>(
      `mutation ($obj: restaurant_dish_comments_insert_input!) {
         insert_restaurant_dish_comments_one(object: $obj) { id created_at }
       }`,
      {
        useAdminSecret: true,
        variables: { obj: { dish_id: params.id, user_id: caller.userId, body: input.body, visibility: input.visibility } },
      }
    );
    if (res.errors?.length) {
      if (/foreign key/i.test(res.errors[0].message)) {
        return NextResponse.json({ error: "Dish not found" }, { status: 404 });
      }
      throw new Error(res.errors[0].message);
    }
    const row = res.data?.insert_restaurant_dish_comments_one;
    // Private comments are never echoed publicly; return only the id.
    return NextResponse.json({
      ok: true,
      visibility: input.visibility,
      comment: input.visibility === "public" && row
        ? { id: row.id, body: input.body, createdAt: row.created_at }
        : null,
    });
  } catch {
    return NextResponse.json({ error: "Couldn't post your comment right now" }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const res = await graphql<{ restaurant_dish_comments: Array<{ user_id: string }> }>(
      `query ($id: uuid!) { restaurant_dish_comments(where: { id: { _eq: $id } }, limit: 1) { user_id } }`,
      { useAdminSecret: true, variables: { id } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    const row = res.data?.restaurant_dish_comments?.[0];
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.user_id !== caller.userId) {
      return NextResponse.json({ error: "You can only remove your own comments." }, { status: 403 });
    }
    const del = await graphql<{ delete_restaurant_dish_comments_by_pk: { id: string } | null }>(
      `mutation ($id: uuid!) { delete_restaurant_dish_comments_by_pk(id: $id) { id } }`,
      { useAdminSecret: true, variables: { id } }
    );
    if (del.errors?.length) throw new Error(del.errors[0].message);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't remove that right now." }, { status: 502 });
  }
}
