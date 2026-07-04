/**
 * GET  /api/active-dishes?handle=<handle>   → that user's currently-active dish
 *        instances (public). Past/inactive instances are returned ONLY to the
 *        owner — the request must carry a valid Bearer access token whose user
 *        id matches the handle's account.
 * POST /api/active-dishes { code }  (X-User-Id header) → deactivate one you own
 *        (sets active_until = now()).
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { normalizeHandle } from "@/lib/handle";
import { verifyNhostJwt, bearerToken } from "@/lib/jwt";

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
    if (!user) return NextResponse.json({ handle, displayName: null, dishes: [], inactiveDishes: [] });

    // Fetch every instance this user authored, then split active vs. inactive
    // client-side (active = active_until still in the future).
    const instRes = await graphql<{ review_instance: Instance[] }>(
      `query ($uid: uuid!) {
         review_instance(
           where: { author_id: { _eq: $uid } }
           order_by: { timestamp: desc }
         ) { id dish_id name difficulty active_until created_at: timestamp }
       }`,
      { useAdminSecret: true, variables: { uid: user.id } }
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

    const nowMs = Date.now();
    // "Open for submission" means active_until is set to a future time (creation
    // sets it to created_at + 24h; deactivating sets it to now). An instance is
    // inactive once that window passes (>24h old or deactivated) OR if it was
    // never marked open for submission (active_until is null).
    const isActive = (i: Instance) =>
      !!i.active_until && new Date(i.active_until).getTime() > nowMs;

    const dishData = (dishId: number) =>
      (dishById.get(dishId)?.dish_data as Record<string, unknown> | null | undefined) ?? null;
    const cleanStr = (v: unknown): string | null =>
      typeof v === "string" && v.trim() ? v.trim() : null;

    const toDish = (i: Instance) => {
      const data = dishData(i.dish_id);
      const desc = cleanStr(data?.description);
      return {
        code: i.id,
        reviewPath: `/s/${i.id}`,
        name: i.name,
        difficulty: i.difficulty,
        activeUntil: i.active_until, // null when never opened for submission
        createdAt: i.created_at,
        dishId: i.dish_id,
        dishName: dishById.get(i.dish_id)?.dish_name ?? null,
        // Quick description — truncated.
        description: desc && desc.length > 160 ? `${desc.slice(0, 160).trimEnd()}…` : desc,
        originalCreator: cleanStr(data?.originalCreator),
        allergens: Array.isArray(data?.allergens)
          ? (data.allergens as unknown[]).filter((x): x is string => typeof x === "string")
          : [],
      };
    };

    // Active oldest-first (matches prior behavior); inactive newest-first.
    const dishes = instances
      .filter(isActive)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(toDish);
    const inactiveDishes = instances.filter((i) => !isActive(i)).map(toDish);

    // Past dishes are private: only include them when the caller proves (via a
    // signature-verified access token) that they own this handle's account.
    const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
    const isOwnerRequest = !!caller && caller.userId === user.id;

    const displayName =
      (typeof user.metadata?.handle === "string" ? user.metadata.handle : null) ?? handle;
    return NextResponse.json({
      handle,
      displayName,
      dishes,
      inactiveDishes: isOwnerRequest ? inactiveDishes : [],
    });
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
