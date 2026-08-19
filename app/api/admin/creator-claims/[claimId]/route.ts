import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { adminGuard } from "@/lib/admin";

export const dynamic = "force-dynamic";
// Nhost can be slow after idle (cold start); the default function timeout killed
// requests mid-mutation — Hasura had already committed, so the client saw a
// "network error" yet the write succeeded. 60s lets the function wait it out.
export const maxDuration = 60;

// PATCH — admin: approve or reject a pending creator claim.
//   { "action": "approve" } → sets creators.owner_id = claim.user_id (only if
//     the creator is still unclaimed) and auto-rejects any other pending
//     claims on the same creator — one active claim wins, matching Spotify's
//     one-active-claim-per-profile rule.
//   { "action": "reject" }  → marks rejected. The creator is untouched.
export async function PATCH(req: NextRequest, { params }: { params: { claimId: string } }) {
  const guard = adminGuard(req);
  if (guard) return guard;

  const claimId = params.claimId;
  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  // Load the claim.
  let claim: { creator_id: string; user_id: string; status: string } | undefined;
  try {
    const res = await graphql<{ creator_claims: Array<typeof claim> }>(
      `query ($id: uuid!) { creator_claims(where: { id: { _eq: $id } }) { creator_id user_id status } }`,
      { useAdminSecret: true, variables: { id: claimId } }
    );
    claim = res.data?.creator_claims?.[0];
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  if (claim.status !== "pending") {
    // Retrying the action that already applied is a success, not a conflict —
    // the first attempt may have committed while its response was lost.
    const wantedStatus = action === "approve" ? "approved" : "rejected";
    if (claim.status === wantedStatus) {
      return NextResponse.json({ ok: true, alreadyApplied: true });
    }
    return NextResponse.json({ error: `Proposal already ${claim.status}` }, { status: 409 });
  }

  const reviewedAt = new Date().toISOString();

  try {
    if (action === "reject") {
      const res = await graphql(
        `mutation ($id: uuid!, $at: timestamptz!) {
           update_creator_claims(where: { id: { _eq: $id } }, _set: { status: "rejected", reviewed_at: $at }) { affected_rows }
         }`,
        { useAdminSecret: true, variables: { id: claimId, at: reviewedAt } }
      );
      if (res.errors?.length) return NextResponse.json({ error: "Could not reject" }, { status: 500 });
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    // approve, step 1: claim ownership only if the creator is still unclaimed —
    // guards the race where two claims on the same creator get approved
    // concurrently, or the creator was claimed some other way in between.
    const claimUpd = await graphql<{ update_creators: { affected_rows: number } }>(
      `mutation ($creatorId: uuid!, $ownerId: uuid!) {
         update_creators(
           where: { id: { _eq: $creatorId }, owner_id: { _is_null: true } }
           _set: { owner_id: $ownerId }
         ) { affected_rows }
       }`,
      { useAdminSecret: true, variables: { creatorId: claim.creator_id, ownerId: claim.user_id } }
    );
    if (claimUpd.errors?.length) {
      console.error("approve creator_claim failed:", claimUpd.errors);
      return NextResponse.json({ error: "Could not apply claim" }, { status: 500 });
    }
    if ((claimUpd.data?.update_creators?.affected_rows ?? 0) === 0) {
      return NextResponse.json({ error: "That profile was already claimed by someone else." }, { status: 409 });
    }

    // Step 2: mark this claim approved, and auto-reject every other pending
    // claim on the same creator — one active claim wins.
    const res = await graphql(
      `mutation ($id: uuid!, $creatorId: uuid!, $at: timestamptz!) {
         update_creator_claims(where: { id: { _eq: $id } }, _set: { status: "approved", reviewed_at: $at }) { affected_rows }
         reject_others: update_creator_claims(
           where: { creator_id: { _eq: $creatorId }, id: { _neq: $id }, status: { _eq: "pending" } }
           _set: { status: "rejected", reviewed_at: $at }
         ) { affected_rows }
       }`,
      { useAdminSecret: true, variables: { id: claimId, creatorId: claim.creator_id, at: reviewedAt } }
    );
    if (res.errors?.length) {
      console.error("approve creator_claim (finalize) failed:", res.errors);
      return NextResponse.json({ error: "Could not apply claim" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status: "approved" });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
