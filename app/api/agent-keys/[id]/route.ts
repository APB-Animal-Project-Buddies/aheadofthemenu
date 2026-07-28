/**
 * DELETE /api/agent-keys/[id]   (Nhost Bearer) — revoke a key you own.
 *
 * Soft delete: revoked_at is stamped rather than the row removed, so rows the
 * key wrote (source = 'agent', api_key_id = …) stay attributable and a bad run
 * remains reversible after the key is gone.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { bearerToken, verifyNhostJwt } from "@/lib/jwt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const owner = await graphql<{ api_keys_by_pk: { user_id: string; revoked_at: string | null } | null }>(
      `query ($id: uuid!) { api_keys_by_pk(id: $id) { user_id revoked_at } }`,
      { useAdminSecret: true, variables: { id: params.id } }
    );
    if (owner.errors?.length) throw new Error(owner.errors[0].message);
    const row = owner.data?.api_keys_by_pk;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.user_id !== caller.userId) {
      return NextResponse.json({ error: "You can only revoke your own keys." }, { status: 403 });
    }
    if (row.revoked_at) return NextResponse.json({ ok: true, alreadyRevoked: true });

    const res = await graphql(
      `mutation ($id: uuid!, $at: timestamptz!) {
         update_api_keys_by_pk(pk_columns: { id: $id }, _set: { revoked_at: $at }) { id }
       }`,
      { useAdminSecret: true, variables: { id: params.id, at: new Date().toISOString() } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("revoke api key failed:", error);
    return NextResponse.json({ error: "Couldn't revoke that key right now." }, { status: 502 });
  }
}
