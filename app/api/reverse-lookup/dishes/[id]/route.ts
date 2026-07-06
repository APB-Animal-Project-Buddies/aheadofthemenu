/**
 * PATCH /api/reverse-lookup/dishes/[id]  (x-admin-secret header)
 * { status: "hidden" | "live" } — moderation killswitch for community dishes.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { adminGuard } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = adminGuard(request);
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (status !== "hidden" && status !== "live") {
    return NextResponse.json({ error: "status must be 'hidden' or 'live'" }, { status: 400 });
  }

  try {
    const res = await graphql<{ update_restaurant_dishes_by_pk: { id: string } | null }>(
      `mutation ($id: uuid!, $status: String!) {
         update_restaurant_dishes_by_pk(pk_columns: { id: $id }, _set: { status: $status }) { id }
       }`,
      { useAdminSecret: true, variables: { id: params.id, status } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    if (!res.data?.update_restaurant_dishes_by_pk) {
      return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, status });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
