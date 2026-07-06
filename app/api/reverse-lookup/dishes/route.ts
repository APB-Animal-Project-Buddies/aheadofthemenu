/**
 * POST /api/reverse-lookup/dishes  (Bearer auth required)
 * Adds a live dish, optionally creating its restaurant inline.
 * IDEMPOTENT: a duplicate dish (or duplicate new restaurant) returns 200 with
 * { existed: true } and the existing row — never a dead-end 409. See the
 * 2026-07-05 cold-start retry fixes for why.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { verifyNhostJwt } from "@/lib/jwt";
import { validateAddDish } from "@/lib/reverse-lookup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);
const isDuplicate = (msg: string) => /unique|duplicate/i.test(msg);

async function findRestaurant(city: string, name: string) {
  const res = await graphql<{ restaurants: Array<{ id: string; name: string }> }>(
    `query ($city: String!, $name: String!) {
       restaurants(where: { city: { _eq: $city }, name: { _ilike: $name } }, limit: 1) { id name }
     }`,
    { useAdminSecret: true, variables: { city, name: likeEscape(name) } }
  );
  return res.data?.restaurants?.[0] ?? null;
}

async function findDish(restaurantId: string, name: string) {
  const res = await graphql<{ restaurant_dishes: Array<{ id: string; name: string }> }>(
    `query ($rid: uuid!, $name: String!) {
       restaurant_dishes(where: { restaurant_id: { _eq: $rid }, name: { _ilike: $name } }, limit: 1) { id name }
     }`,
    { useAdminSecret: true, variables: { rid: restaurantId, name: likeEscape(name) } }
  );
  return res.data?.restaurant_dishes?.[0] ?? null;
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const caller = verifyNhostJwt(token);
  if (!caller) return NextResponse.json({ error: "Sign in to add a dish" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const input = validateAddDish(body);
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });
  const city = "seattle"; // single-city v1; schema is city-ready

  try {
    // Resolve the venue: given id, or create inline (duplicate → reuse existing).
    let restaurantId = input.restaurantId;
    if (!restaurantId && input.newRestaurant) {
      const nr = input.newRestaurant;
      const res = await graphql<{ insert_restaurants_one: { id: string } | null }>(
        `mutation ($obj: restaurants_insert_input!) {
           insert_restaurants_one(object: $obj) { id }
         }`,
        {
          useAdminSecret: true,
          variables: {
            obj: {
              city, name: nr.name, website: nr.website, created_by: caller.userId,
              locations: { data: [{ address: nr.address, neighborhood: nr.neighborhood }] },
            },
          },
        }
      );
      if (res.errors?.length) {
        if (!isDuplicate(res.errors[0].message)) throw new Error(res.errors[0].message);
        restaurantId = (await findRestaurant(city, nr.name))?.id ?? null;
      } else {
        restaurantId = res.data?.insert_restaurants_one?.id ?? null;
      }
    }
    if (!restaurantId) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

    const res = await graphql<{ insert_restaurant_dishes_one: { id: string } | null }>(
      `mutation ($obj: restaurant_dishes_insert_input!) {
         insert_restaurant_dishes_one(object: $obj) { id }
       }`,
      {
        useAdminSecret: true,
        variables: {
          obj: {
            restaurant_id: restaurantId, name: input.name, description: input.description,
            tags: input.tags, created_by: caller.userId,
          },
        },
      }
    );
    if (res.errors?.length) {
      if (!isDuplicate(res.errors[0].message)) throw new Error(res.errors[0].message);
      const existing = await findDish(restaurantId, input.name);
      return NextResponse.json({ ok: true, existed: true, dishId: existing?.id ?? null, restaurantId });
    }
    return NextResponse.json({ ok: true, dishId: res.data?.insert_restaurant_dishes_one?.id, restaurantId });
  } catch {
    return NextResponse.json({ error: "Couldn't add the dish right now" }, { status: 502 });
  }
}
