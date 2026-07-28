/**
 * PATCH /api/admin/eat-this/edits/[editId]  (admin only, x-admin-secret)
 *   { "action": "approve" } → applies the proposed fields to the dish, marks approved.
 *   { "action": "reject" }  → marks rejected; the dish is untouched.
 * Mirrors /api/admin/edits/[editId].
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { adminGuard } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function PATCH(req: NextRequest, { params }: { params: { editId: string } }) {
  const guard = adminGuard(req);
  if (guard) return guard;

  const editId = params.editId;
  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  // Load the proposal.
  let edit: { dish_id: string; proposed: any; status: string } | undefined;
  try {
    const res = await graphql<{ restaurant_dish_edits: Array<typeof edit> }>(
      `query ($id: uuid!) { restaurant_dish_edits(where: { id: { _eq: $id } }) { dish_id proposed status } }`,
      { useAdminSecret: true, variables: { id: editId } }
    );
    edit = res.data?.restaurant_dish_edits?.[0];
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
  if (!edit) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  if (edit.status !== "pending") {
    // Retrying the action that already applied is a success, not a conflict.
    const wanted = action === "approve" ? "approved" : "rejected";
    if (edit.status === wanted) return NextResponse.json({ ok: true, status: edit.status, alreadyApplied: true });
    return NextResponse.json({ error: `Proposal already ${edit.status}` }, { status: 409 });
  }

  const reviewedAt = new Date().toISOString();
  try {
    if (action === "reject") {
      const res = await graphql(
        `mutation ($id: uuid!, $at: timestamptz!) {
           update_restaurant_dish_edits(where: { id: { _eq: $id } }, _set: { status: "rejected", reviewed_at: $at }) { affected_rows }
         }`,
        { useAdminSecret: true, variables: { id: editId, at: reviewedAt } }
      );
      if (res.errors?.length) return NextResponse.json({ error: "Could not reject" }, { status: 500 });
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    // approve: apply the proposed fields to the dish + mark the proposal approved.
    const res = await graphql(
      `mutation ($dishId: uuid!, $set: restaurant_dishes_set_input!, $id: uuid!, $at: timestamptz!) {
         update_restaurant_dishes(where: { id: { _eq: $dishId } }, _set: $set) { affected_rows }
         update_restaurant_dish_edits(where: { id: { _eq: $id } }, _set: { status: "approved", reviewed_at: $at }) { affected_rows }
       }`,
      { useAdminSecret: true, variables: { dishId: edit.dish_id, set: edit.proposed || {}, id: editId, at: reviewedAt } }
    );
    if (res.errors?.length) {
      console.error("approve rl dish_edit failed:", res.errors);
      return NextResponse.json({ error: "Could not apply edit" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status: "approved", dishId: edit.dish_id });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
