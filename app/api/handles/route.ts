import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { normalizeHandle, validateHandle } from "@/lib/handle";

type UsersResult = { users: { id: string }[] };

/** True if no *other* user already has this handle in their metadata. */
async function isAvailable(handle: string, excludeUserId?: string): Promise<boolean> {
  const res = await graphql<UsersResult>(
    `query ($h: jsonb!) {
       users(where: { metadata: { _contains: $h } }, limit: 1) { id }
     }`,
    { variables: { h: { handle } }, useAdminSecret: true }
  );
  const rows = res.data?.users ?? [];
  return rows.every((u) => u.id === excludeUserId);
}

// GET /api/handles?handle=foo  → { available, error? }
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("handle") ?? "";
  const handle = normalizeHandle(raw);
  const err = validateHandle(handle);
  if (err) return NextResponse.json({ available: false, error: err });
  try {
    return NextResponse.json({ available: await isAvailable(handle) });
  } catch {
    return NextResponse.json({ available: false, error: "Couldn't check availability" }, { status: 500 });
  }
}

// POST /api/handles  { handle }  (X-User-Id header) → sets the caller's handle
export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const handle = normalizeHandle(String(body.handle ?? ""));
  const err = validateHandle(handle);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    if (!(await isAvailable(handle, userId))) {
      return NextResponse.json({ error: "That handle is taken" }, { status: 409 });
    }
    // _append merges the key into the existing jsonb metadata (preserves user_type, role, zip_code).
    const res = await graphql(
      `mutation ($id: uuid!, $patch: jsonb!) {
         update_users(where: { id: { _eq: $id } }, _append: { metadata: $patch }) { affected_rows }
       }`,
      { variables: { id: userId, patch: { handle } }, useAdminSecret: true }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    return NextResponse.json({ ok: true, handle });
  } catch {
    return NextResponse.json({ error: "Couldn't save handle" }, { status: 500 });
  }
}
