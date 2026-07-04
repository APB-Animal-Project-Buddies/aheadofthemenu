/**
 * QR pool claim API.
 *
 *   GET  /api/qr/claim            (Bearer) -> { qrs: [...] }  the caller's claimed codes
 *   POST /api/qr/claim            (Bearer) { code, targetType, instanceCode? }
 *                                 -> { ok, url }  bind an open code to the caller + target
 *
 * Codes live in public.open_qrs_for_potluck, seeded unclaimed (owner_id NULL).
 * A code can be claimed if it is open OR already owned by the caller (so the
 * owner can freely re-point/relabel it). Auth is the same signed HS256 access
 * token used by the past-dishes gate — writing ownership must be authenticated.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { verifyNhostJwt, bearerToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

type QrRow = {
  code: string;
  owner_id: string | null;
  target_type: "active_dishes" | "dish_instance" | null;
  target_id: string | null;
  label: string | null;
};

/** Accept a raw code ("pot-h4k2") or a pasted URL (".../q/pot-h4k2") and return the code. */
function normalizeCode(raw: string): string {
  let s = String(raw ?? "").trim();
  if (!s) return "";
  // If a URL/path was pasted, take the segment after the last "/q/".
  const m = s.match(/\/q\/([^/?#\s]+)/i);
  if (m) return m[1];
  // Otherwise strip any stray query/hash and leading slashes.
  s = s.replace(/^https?:\/\/[^/]+/i, "").replace(/[?#].*$/, "").replace(/^\/+/, "");
  return s;
}

/** Accept a raw instance code or a pasted "/dishes/15?instance=abc123" and return the code. */
function normalizeInstanceCode(raw: string): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const m = s.match(/[?&]instance=([^&#\s]+)/i);
  return (m ? m[1] : s).trim();
}

/** Build the live destination a claimed code resolves to. */
function targetUrl(targetType: string, handle: string, dishId: number | null, instanceCode: string | null): string {
  if (targetType === "dish_instance" && dishId != null && instanceCode) {
    return `/dishes/${dishId}?instance=${instanceCode}`;
  }
  return `/${handle}/active-dishes`;
}

export async function GET(request: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // ?code=<code|link> -> status of one code (used by the scanner to decide the
  // outcome): open | mine | taken | unknown.
  const scanned = normalizeCode(new URL(request.url).searchParams.get("code") ?? "");
  if (scanned) {
    try {
      const res = await graphql<{ open_qrs_for_potluck: QrRow[] }>(
        `query ($code: String!) {
           open_qrs_for_potluck(where: { code: { _eq: $code } }, limit: 1) {
             code owner_id target_type target_id label
           }
         }`,
        { useAdminSecret: true, variables: { code: scanned } }
      );
      if (res.errors?.length) throw new Error(res.errors[0].message);
      const row = res.data?.open_qrs_for_potluck?.[0];
      if (!row) return NextResponse.json({ status: "unknown", code: scanned });
      if (!row.owner_id) return NextResponse.json({ status: "open", code: row.code });
      if (row.owner_id === caller.userId)
        return NextResponse.json({ status: "mine", code: row.code, target_type: row.target_type, target_id: row.target_id });
      return NextResponse.json({ status: "taken", code: row.code });
    } catch {
      return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
    }
  }

  try {
    const res = await graphql<{ open_qrs_for_potluck: QrRow[] }>(
      `query ($uid: uuid!) {
         open_qrs_for_potluck(where: { owner_id: { _eq: $uid } }, order_by: { claimed_at: desc }) {
           code owner_id target_type target_id label
         }
       }`,
      { useAdminSecret: true, variables: { uid: caller.userId } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    return NextResponse.json({ qrs: res.data?.open_qrs_for_potluck ?? [] });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const code = normalizeCode(body?.code);
  const targetType = body?.targetType === "dish_instance" ? "dish_instance" : "active_dishes";
  const instanceCode = targetType === "dish_instance" ? normalizeInstanceCode(body?.instanceCode) : null;

  if (!code) return NextResponse.json({ error: "Enter a QR code or its link." }, { status: 400 });
  if (targetType === "dish_instance" && !instanceCode) {
    return NextResponse.json({ error: "Enter the dish-instance link or code to point at." }, { status: 400 });
  }

  try {
    // 1) The code must exist in the pool and be open or already the caller's.
    const cur = await graphql<{ open_qrs_for_potluck: QrRow[] }>(
      `query ($code: String!) {
         open_qrs_for_potluck(where: { code: { _eq: $code } }, limit: 1) {
           code owner_id target_type target_id label
         }
       }`,
      { useAdminSecret: true, variables: { code } }
    );
    if (cur.errors?.length) throw new Error(cur.errors[0].message);
    const row = cur.data?.open_qrs_for_potluck?.[0];
    if (!row) return NextResponse.json({ error: "That code isn't a valid potluck QR." }, { status: 404 });
    if (row.owner_id && row.owner_id !== caller.userId) {
      return NextResponse.json({ error: "That QR is already claimed by someone else." }, { status: 409 });
    }

    // 2) For a dish-instance target, resolve (and validate) the instance -> dish id.
    let dishId: number | null = null;
    if (targetType === "dish_instance") {
      const inst = await graphql<{ review_instance: Array<{ id: string; dish_id: number }> }>(
        `query ($code: bpchar!) {
           review_instance(where: { id: { _eq: $code } }, limit: 1) { id dish_id }
         }`,
        { useAdminSecret: true, variables: { code: instanceCode } }
      );
      if (inst.errors?.length) throw new Error(inst.errors[0].message);
      const found = inst.data?.review_instance?.[0];
      if (!found) return NextResponse.json({ error: "No dish instance found for that link." }, { status: 404 });
      dishId = found.dish_id;
    }

    // 3) Resolve the caller's handle for the active-dishes destination.
    const me = await graphql<{ users: Array<{ handle: string }> }>(
      `query ($uid: uuid!) { users(where: { id: { _eq: $uid } }, limit: 1) { handle } }`,
      { useAdminSecret: true, variables: { uid: caller.userId } }
    );
    if (me.errors?.length) throw new Error(me.errors[0].message);
    const handle = me.data?.users?.[0]?.handle;
    if (!handle) return NextResponse.json({ error: "Your account has no handle yet." }, { status: 400 });

    // 4) Bind the code.
    const upd = await graphql<{ update_open_qrs_for_potluck: { affected_rows: number } }>(
      `mutation ($code: String!, $uid: uuid!, $tt: qr_target_type!, $tid: String, $now: timestamptz!) {
         update_open_qrs_for_potluck(
           where: { code: { _eq: $code } }
           _set: { owner_id: $uid, target_type: $tt, target_id: $tid, claimed_at: $now }
         ) { affected_rows }
       }`,
      {
        useAdminSecret: true,
        variables: {
          code,
          uid: caller.userId,
          tt: targetType,
          tid: targetType === "dish_instance" ? instanceCode : null,
          now: new Date().toISOString(),
        },
      }
    );
    if (upd.errors?.length) throw new Error(upd.errors[0].message);
    if ((upd.data?.update_open_qrs_for_potluck?.affected_rows ?? 0) === 0) {
      return NextResponse.json({ error: "Couldn't claim that code." }, { status: 409 });
    }

    return NextResponse.json({ ok: true, code, url: targetUrl(targetType, handle, dishId, instanceCode) });
  } catch {
    return NextResponse.json({ error: "Couldn't claim that code right now." }, { status: 502 });
  }
}
