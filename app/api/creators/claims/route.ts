/**
 * /api/creators/claims — claiming an EXISTING creator profile (path a).
 *
 *   POST -> submit a claim request. Does NOT set owner_id: inserts a pending
 *           creator_claims row for admin review, mirroring
 *           POST /api/dishes/[id]/edits' propose-then-approve shape.
 *   GET  -> the caller's own claim history + current ownership, driving the
 *           /profile section's search-form / pending-banner / owned-summary
 *           states.
 *
 * Both require a signed-in caller (Bearer access token) — a claim is
 * inherently tied to an identity, unlike dish_edits' anonymous proposer.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { verifyNhostJwt, bearerToken } from "@/lib/jwt";
import { sendCreatorClaimNotification } from "@/lib/email";

export const dynamic = "force-dynamic";
// Nhost can be slow after idle (cold start); the default function timeout killed
// requests mid-mutation — Hasura had already committed, so the client saw a
// "network error" yet the write succeeded. 60s lets the function wait it out.
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// `note` doubles as the claim's evidence: a link to the claimant's channel,
// profile, or a press mention the admin can check. Without this, "evidence"
// is just an unvalidated freeform string — require it to look like a URL.
const URL_RE = /^https?:\/\/.+/i;

type ClaimRow = {
  id: string;
  creator_id: string;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  created_at: string;
  reviewed_at: string | null;
  creator: { id: string; display_name: string; slug: string | null };
};

export async function POST(req: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(req.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const creatorId = String(body?.creatorId ?? "").trim();
  if (!UUID_RE.test(creatorId)) {
    return NextResponse.json({ error: "Missing or invalid creatorId" }, { status: 400 });
  }
  // Evidence is required, not decorative: a bare "trust me" claim is exactly
  // what an admin reviewer can't act on. Same 10-char floor the client enforces
  // (checked again here — the client check is a UX nicety, not the gate).
  const noteRaw = typeof body?.note === "string" ? body.note.trim() : "";
  if (noteRaw.length < 10) {
    return NextResponse.json(
      { error: "Tell us how we can verify this is you — a link to your channel, site, or a public post works best." },
      { status: 400 }
    );
  }
  const note = noteRaw.slice(0, 2000);
  if (!note || !URL_RE.test(note)) {
    return NextResponse.json(
      { error: "Please include a link (channel, profile, or press mention) as evidence" },
      { status: 400 }
    );
  }

  try {
    // The creator must exist and be unclaimed.
    const cur = await graphql<{ creators: Array<{ id: string; owner_id: string | null }> }>(
      `query ($id: uuid!) { creators(where: { id: { _eq: $id } }, limit: 1) { id owner_id } }`,
      { useAdminSecret: true, variables: { id: creatorId } }
    );
    if (cur.errors?.length) throw new Error(cur.errors[0].message);
    const creator = cur.data?.creators?.[0];
    if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    if (creator.owner_id) {
      return NextResponse.json({ error: "That profile is already claimed." }, { status: 409 });
    }

    // Pre-check: is there already a pending claim on this creator, from
    // anyone? The unique index (creator_claims_one_pending_per_creator_idx)
    // allows at most one pending claim per creator regardless of who
    // submitted it, so this covers two cases:
    //   - it's the caller's own pending claim (e.g. the first response was
    //     lost) — idempotent retry, hand it back instead of erroring.
    //   - it's someone else's pending claim — tell the caller clearly
    //     instead of letting the insert fail with a raw constraint error.
    const existing = await graphql<{ creator_claims: Array<{ id: string; status: string; user_id: string }> }>(
      `query ($cid: uuid!) {
         creator_claims(where: { creator_id: { _eq: $cid }, status: { _eq: "pending" } }, limit: 1) {
           id status user_id
         }
       }`,
      { useAdminSecret: true, variables: { cid: creatorId } }
    );
    if (existing.errors?.length) throw new Error(existing.errors[0].message);
    const already = existing.data?.creator_claims?.[0];
    if (already) {
      if (already.user_id === caller.userId) {
        return NextResponse.json({ ok: true, claim: { id: already.id, status: "pending" } });
      }
      return NextResponse.json(
        { error: "Someone else already has a pending claim on this profile — check back once it's reviewed." },
        { status: 409 }
      );
    }

    const ins = await graphql<{
      insert_creator_claims_one: {
        id: string;
        status: string;
        creator: { display_name: string; slug: string | null };
        user: { email: string | null };
      } | null;
    }>(
      `mutation ($cid: uuid!, $uid: uuid!, $note: String) {
         insert_creator_claims_one(object: { creator_id: $cid, user_id: $uid, note: $note }) {
           id status
           creator { display_name slug }
           user { email }
         }
       }`,
      { useAdminSecret: true, variables: { cid: creatorId, uid: caller.userId, note } }
    );
    if (ins.errors?.length) {
      // Raced with another insert on the same creator (by this user or
      // another) between the pre-check above and this insert — re-resolve
      // against the partial unique index on creator_id alone.
      const msg = ins.errors[0].message;
      if (/creator_claims_one_pending_per_creator_idx/i.test(msg)) {
        const again = await graphql<{ creator_claims: Array<{ id: string; user_id: string }> }>(
          `query ($cid: uuid!) {
             creator_claims(where: { creator_id: { _eq: $cid }, status: { _eq: "pending" } }, limit: 1) { id user_id }
           }`,
          { useAdminSecret: true, variables: { cid: creatorId } }
        );
        const row = again.data?.creator_claims?.[0];
        if (row) {
          if (row.user_id === caller.userId) {
            return NextResponse.json({ ok: true, claim: { id: row.id, status: "pending" } });
          }
          return NextResponse.json(
            { error: "Someone else already has a pending claim on this profile — check back once it's reviewed." },
            { status: 409 }
          );
        }
      }
      throw new Error(msg);
    }
    const claim = ins.data?.insert_creator_claims_one;
    if (!claim) throw new Error("insert_creator_claims_one returned nothing");

    // Best-effort: an admin has no other way to learn this claim exists short
    // of polling /admin/edits, so notify immediately. Never let this affect
    // the response — the claim row is already committed above.
    if (claim.user.email) {
      await sendCreatorClaimNotification({
        claimId: claim.id,
        creatorDisplayName: claim.creator.display_name,
        creatorSlug: claim.creator.slug,
        claimantEmail: claim.user.email,
        claimantUserId: caller.userId,
        evidence: note,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, claim: { id: claim.id, status: claim.status } });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(req.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const res = await graphql<{
      creator_claims: ClaimRow[];
      creators: Array<{ id: string; display_name: string; slug: string | null; image_url: string | null }>;
    }>(
      `query ($uid: uuid!) {
         creator_claims(where: { user_id: { _eq: $uid } }, order_by: { created_at: desc }) {
           id creator_id status note created_at reviewed_at
           creator { id display_name slug }
         }
         creators(where: { owner_id: { _eq: $uid } }, limit: 1) { id display_name slug image_url }
       }`,
      { useAdminSecret: true, variables: { uid: caller.userId } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    return NextResponse.json({
      claims: res.data?.creator_claims ?? [],
      owned: res.data?.creators?.[0] ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}

// DELETE /api/creators/claims  { claimId }  (Bearer token) → withdraws the
// caller's OWN pending claim. Approved/rejected claims are history and stay.
// Without this, a mis-click (claiming the wrong creator) leaves the user
// stuck on the pending banner AND blocks everyone else — the DB allows only
// one pending claim per creator.
export async function DELETE(req: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(req.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const claimId = String(body?.claimId ?? "").trim();
  if (!UUID_RE.test(claimId)) return NextResponse.json({ error: "Missing or invalid claimId" }, { status: 400 });

  try {
    const res = await graphql<{ delete_creator_claims: { affected_rows: number } }>(
      `mutation ($id: uuid!, $uid: uuid!) {
         delete_creator_claims(where: { id: { _eq: $id }, user_id: { _eq: $uid }, status: { _eq: "pending" } }) {
           affected_rows
         }
       }`,
      { useAdminSecret: true, variables: { id: claimId, uid: caller.userId } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    // 0 rows = not yours, not pending, or already gone — all fine to report as
    // "nothing pending", since the client's next GET reflects the truth.
    return NextResponse.json({ ok: true, withdrawn: (res.data?.delete_creator_claims.affected_rows ?? 0) > 0 });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
