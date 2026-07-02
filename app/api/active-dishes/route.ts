/**
 * GET  /api/active-dishes?handle=<handle>   → that user's currently-active dish
 *        instances (active_until > now), oldest-first (order of creation).
 * POST /api/active-dishes { code }  (X-User-Id header) → deactivate one you own
 *        (sets active_until = now()).
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { normalizeHandle } from "@/lib/handle";

export const dynamic = "force-dynamic";

type UserRow = { id: string; metadata: Record<string, unknown> | null };
type Instance = {
  id: string;
  dish_id: number;
  name: string;
  difficulty: number | null;
  active_until: string;
  created_at: string;
};
type Dish = { id: number; dish_name: string; dish_data: Record<string, unknown> | null };

async function userByHandle(handle: string): Promise<UserRow | null> {
  const res = await graphql<{ users: UserRow[] }>(
    `query ($h: jsonb!) {
       users(where: { metadata: { _contains: $h } }, limit: 1) { id metadata }
     }`,
    { useAdminSecret: true, variables: { h: { handle } } }
  );
  return res.data?.users?.[0] ?? null;
}

export async function GET(request: NextRequest) {
  const handle = normalizeHandle(request.nextUrl.searchParams.get("handle") ?? "");
  if (!handle) return NextResponse.json({ error: "Missing handle" }, { status: 400 });

  try {
    const user = await userByHandle(handle);
    if (!user) return NextResponse.json({ handle, displayName: null, dishes: [] });

    const now = new Date().toISOString();
    const instRes = await graphql<{ review_instance: Instance[] }>(
      `query ($uid: uuid!, $now: timestamptz!) {
         review_instance(
           where: { author_id: { _eq: $uid }, active_until: { _gt: $now } }
           order_by: { created_at: asc }
         ) { id dish_id name difficulty active_until created_at }
       }`,
      { useAdminSecret: true, variables: { uid: user.id, now } }
    );
    if (instRes.errors?.length) throw new Error(instRes.errors[0].message);
    const instances = instRes.data?.review_instance ?? [];

    const dishIds = Array.from(new Set(instances.map((i) => i.dish_id)));
    const dishById = new Map<number, Dish>();
    if (dishIds.length) {
      const dishRes = await graphql<{ dishes: Dish[] }>(
        `query ($ids: [Int!]!) { dishes(where: { id: { _in: $ids } }) { id dish_name dish_data } }`,
        { useAdminSecret: true, variables: { ids: dishIds } }
      );
      for (const d of dishRes.data?.dishes ?? []) dishById.set(d.id, d);
    }

    const dishes = instances.map((i) => ({
      code: i.id,
      reviewPath: `/s/${i.id}`,
      name: i.name,
      difficulty: i.difficulty,
      activeUntil: i.active_until,
      createdAt: i.created_at,
      dishId: i.dish_id,
      dishName: dishById.get(i.dish_id)?.dish_name ?? null,
    }));

    const displayName =
      (typeof user.metadata?.handle === "string" ? user.metadata.handle : null) ?? handle;
    return NextResponse.json({ handle, displayName, dishes });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const code = String(body?.code ?? "").trim();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  try {
    // Only the author can deactivate — set active_until to now (past).
    const res = await graphql<{ update_review_instance: { affected_rows: number } }>(
      `mutation ($code: bpchar!, $uid: uuid!, $now: timestamptz!) {
         update_review_instance(
           where: { id: { _eq: $code }, author_id: { _eq: $uid } }
           _set: { active_until: $now }
         ) { affected_rows }
       }`,
      { useAdminSecret: true, variables: { code, uid: userId, now: new Date().toISOString() } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    const ok = (res.data?.update_review_instance?.affected_rows ?? 0) > 0;
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  } catch {
    return NextResponse.json({ error: "Couldn't deactivate" }, { status: 502 });
  }
}
