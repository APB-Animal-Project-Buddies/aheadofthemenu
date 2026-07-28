/**
 * POST /api/agent/eat-this/dishes   (API key, scope eat-this:write)
 *
 * Adds a live dish to an existing restaurant. Unlike the browser route, an
 * agent must supply a real `restaurantId` — the inline "create the venue too"
 * path stays browser-only, because a single call that invents both a venue and
 * a dish is exactly how duplicate venues get in. Agents resolve first via
 * GET /api/eat-this/restaurants, or create explicitly via
 * POST /api/agent/eat-this/restaurants.
 *
 * Idempotent: a duplicate dish returns 200 { existed: true } with the existing
 * row, matching the browser route rather than dead-ending on a 409.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { fail, gate, readJson } from "@/lib/agent-http";
import { validateAddDish } from "@/lib/eat-this";
import { dishUrl } from "@/lib/eat-this-agent";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export async function POST(request: NextRequest) {
  const g = await gate(request, "eat-this:write", "add_dish");
  if (!g.ok) return g.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const restaurantId = String(body?.restaurantId ?? "").trim();
  if (!restaurantId || !UUID_RE.test(restaurantId)) {
    return fail(
      "invalid_input",
      "A valid restaurantId is required. Resolve one via GET /api/eat-this/restaurants?q="
    );
  }

  // Reuse the browser validator so the two paths can't drift. It also accepts
  // a newRestaurant blob, which we've already refused above.
  const input = validateAddDish({ ...body, restaurantId });
  if ("error" in input) return fail("invalid_input", input.error);

  try {
    const venue = await graphql<{ restaurants_by_pk: { id: string } | null }>(
      `query ($id: uuid!) { restaurants_by_pk(id: $id) { id } }`,
      { useAdminSecret: true, variables: { id: restaurantId } }
    );
    if (venue.errors?.length) throw new Error(venue.errors[0].message);
    if (!venue.data?.restaurants_by_pk) {
      return fail("restaurant_not_found", "No restaurant with that id.");
    }

    const res = await graphql<{ insert_restaurant_dishes_one: { id: string } | null }>(
      `mutation ($obj: restaurant_dishes_insert_input!) {
         insert_restaurant_dishes_one(object: $obj) { id }
       }`,
      {
        useAdminSecret: true,
        variables: {
          obj: {
            restaurant_id: restaurantId,
            name: input.name,
            description: input.description,
            tags: input.tags,
            availability: input.availability,
            customizations: input.customizations,
            created_by: g.caller.userId,
            source: "agent",
            api_key_id: g.caller.apiKeyId,
          },
        },
      }
    );

    if (res.errors?.length) {
      const msg = res.errors[0].message;
      if (/unique|duplicate/i.test(msg)) {
        const existing = await graphql<{ restaurant_dishes: Array<{ id: string }> }>(
          `query ($rid: uuid!, $name: String!) {
             restaurant_dishes(where: { restaurant_id: { _eq: $rid }, name: { _ilike: $name } }, limit: 1) { id }
           }`,
          { useAdminSecret: true, variables: { rid: restaurantId, name: likeEscape(input.name) } }
        );
        const id = existing.data?.restaurant_dishes?.[0]?.id ?? null;
        return NextResponse.json({
          ok: true,
          existed: true,
          dishId: id,
          restaurantId,
          url: id ? dishUrl(id) : null,
        });
      }
      throw new Error(msg);
    }

    const id = res.data?.insert_restaurant_dishes_one?.id ?? null;
    return NextResponse.json({
      ok: true,
      existed: false,
      dishId: id,
      restaurantId,
      url: id ? dishUrl(id) : null,
      rateLimitRemaining: g.remaining,
    });
  } catch (error) {
    console.error("agent add dish failed:", error);
    return fail("upstream_unavailable", "Couldn't add that dish right now.");
  }
}
