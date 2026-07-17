/**
 * POST /api/eat-this/dishes/[id]/customizations  (Bearer — any signed-in user)
 * Append-only: merges the given customization names into the dish's list (union,
 * deduped, capped). Additive/low-risk metadata that powers the rating breakdown,
 * so it's open to all signed-in users (removing/renaming stays in the edit flow).
 * Body: { customizations: string[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { bearerToken, verifyNhostJwt } from "@/lib/jwt";
import { strList } from "@/lib/eat-this";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX = 30;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const caller = verifyNhostJwt(bearerToken(req.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Sign in to add customizations" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const additions = strList(body?.customizations, 60, MAX);
  if (!additions.length) return NextResponse.json({ error: "Add at least one customization" }, { status: 400 });

  try {
    const cur = await graphql<{ restaurant_dishes_by_pk: { customizations: unknown } | null }>(
      `query ($id: uuid!) { restaurant_dishes_by_pk(id: $id) { customizations } }`,
      { useAdminSecret: true, variables: { id: params.id } }
    );
    const dish = cur.data?.restaurant_dishes_by_pk;
    if (!dish) return NextResponse.json({ error: "Dish not found" }, { status: 404 });

    const existing = Array.isArray(dish.customizations) ? (dish.customizations as string[]) : [];
    const merged = Array.from(new Set([...existing, ...additions])).slice(0, MAX);

    const res = await graphql(
      `mutation ($id: uuid!, $c: jsonb!) {
         update_restaurant_dishes(where: { id: { _eq: $id } }, _set: { customizations: $c }) { affected_rows }
       }`,
      { useAdminSecret: true, variables: { id: params.id, c: merged } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    return NextResponse.json({ ok: true, customizations: merged });
  } catch {
    return NextResponse.json({ error: "Couldn't add those right now" }, { status: 502 });
  }
}
