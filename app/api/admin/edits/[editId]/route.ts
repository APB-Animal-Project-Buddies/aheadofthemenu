import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { adminGuard } from "@/lib/admin";

export const dynamic = "force-dynamic";

// PATCH — admin: approve or reject a pending proposal.
//   { "action": "approve" } → applies proposed_data to the dish, marks approved.
//   { "action": "reject" }  → marks rejected. The dish is untouched.
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
  let edit: { dish_id: number; proposed_data: any; status: string } | undefined;
  try {
    const res = await graphql<{ dish_edits: Array<typeof edit> }>(
      `query ($id: uuid!) { dish_edits(where: { id: { _eq: $id } }) { dish_id proposed_data status } }`,
      { useAdminSecret: true, variables: { id: editId } }
    );
    edit = res.data?.dish_edits?.[0];
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
  if (!edit) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  if (edit.status !== "pending") {
    return NextResponse.json({ error: `Proposal already ${edit.status}` }, { status: 409 });
  }

  const reviewedAt = new Date().toISOString();

  try {
    if (action === "reject") {
      const res = await graphql(
        `mutation ($id: uuid!, $at: timestamptz!) {
           update_dish_edits(where: { id: { _eq: $id } }, _set: { status: "rejected", reviewed_at: $at }) { affected_rows }
         }`,
        { useAdminSecret: true, variables: { id: editId, at: reviewedAt } }
      );
      if (res.errors?.length) return NextResponse.json({ error: "Could not reject" }, { status: 500 });
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    // approve: apply the proposed snapshot to the dish + mark the proposal approved.
    const data = edit.proposed_data || {};
    const res = await graphql(
      `mutation ($dishId: Int!, $name: String!, $data: jsonb!, $id: uuid!, $at: timestamptz!) {
         update_dishes(where: { id: { _eq: $dishId } }, _set: { dish_name: $name, dish_data: $data }) { affected_rows }
         update_dish_edits(where: { id: { _eq: $id } }, _set: { status: "approved", reviewed_at: $at }) { affected_rows }
       }`,
      {
        useAdminSecret: true,
        variables: { dishId: edit.dish_id, name: data.title ?? "Untitled", data, id: editId, at: reviewedAt },
      }
    );
    if (res.errors?.length) {
      console.error("approve dish_edit failed:", res.errors);
      return NextResponse.json({ error: "Could not apply edit" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status: "approved", dishId: edit.dish_id });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
