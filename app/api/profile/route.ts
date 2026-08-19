import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { verifyNhostJwt, bearerToken } from "@/lib/jwt";

// Nhost cold starts can outlast the default function timeout; give it room.
export const maxDuration = 60;

const MAX_ZIP_LENGTH = 20;

// PATCH /api/profile  { zipCode }  (Bearer token) → updates the caller's own zip code
export async function PATCH(req: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(req.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const raw = typeof body?.zipCode === "string" ? body.zipCode.trim() : "";
  if (raw.length > MAX_ZIP_LENGTH) {
    return NextResponse.json({ error: `Zip code must be ${MAX_ZIP_LENGTH} characters or fewer` }, { status: 400 });
  }
  const zipCode = raw || null;

  try {
    // _append merges the key into the existing jsonb metadata (preserves user_type, role, handle).
    const res = await graphql(
      `mutation ($id: uuid!, $patch: jsonb!) {
         updateUsers(where: { id: { _eq: $id } }, _append: { metadata: $patch }) { affected_rows }
       }`,
      { variables: { id: caller.userId, patch: { zip_code: zipCode } }, useAdminSecret: true }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    return NextResponse.json({ ok: true, zipCode });
  } catch {
    return NextResponse.json({ error: "Couldn't save zip code" }, { status: 500 });
  }
}
