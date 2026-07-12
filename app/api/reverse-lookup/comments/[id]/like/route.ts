/**
 * PUT    /api/reverse-lookup/comments/[id]/like  (Bearer)  — like a comment
 * DELETE /api/reverse-lookup/comments/[id]/like  (Bearer)  — remove your like
 * One like per user per comment (PK on comment_id,user_id → idempotent).
 * Returns the fresh like count for optimistic-UI reconciliation.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { bearerToken, verifyNhostJwt } from "@/lib/jwt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function likeCount(commentId: string): Promise<number> {
  const res = await graphql<{ restaurant_dish_comment_likes_aggregate: { aggregate: { count: number } } }>(
    `query ($id: uuid!) {
       restaurant_dish_comment_likes_aggregate(where: { comment_id: { _eq: $id } }) { aggregate { count } }
     }`,
    { useAdminSecret: true, variables: { id: commentId } }
  );
  return res.data?.restaurant_dish_comment_likes_aggregate?.aggregate?.count ?? 0;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Sign in to like" }, { status: 401 });
  try {
    const res = await graphql(
      `mutation ($obj: restaurant_dish_comment_likes_insert_input!) {
         insert_restaurant_dish_comment_likes_one(
           object: $obj,
           on_conflict: { constraint: restaurant_dish_comment_likes_pkey, update_columns: [] }
         ) { comment_id }
       }`,
      { useAdminSecret: true, variables: { obj: { comment_id: params.id, user_id: caller.userId } } }
    );
    if (res.errors?.length) {
      if (/foreign key/i.test(res.errors[0].message)) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }
      throw new Error(res.errors[0].message);
    }
    return NextResponse.json({ ok: true, liked: true, likeCount: await likeCount(params.id) });
  } catch {
    return NextResponse.json({ error: "Couldn't like that right now" }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Sign in to like" }, { status: 401 });
  try {
    const res = await graphql(
      `mutation ($id: uuid!, $user: uuid!) {
         delete_restaurant_dish_comment_likes_by_pk(comment_id: $id, user_id: $user) { comment_id }
       }`,
      { useAdminSecret: true, variables: { id: params.id, user: caller.userId } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    return NextResponse.json({ ok: true, liked: false, likeCount: await likeCount(params.id) });
  } catch {
    return NextResponse.json({ error: "Couldn't update that right now" }, { status: 502 });
  }
}
