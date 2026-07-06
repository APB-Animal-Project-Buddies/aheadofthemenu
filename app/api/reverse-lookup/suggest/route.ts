/**
 * POST /api/reverse-lookup/suggest
 * Body: { dishName, restaurantName, city?, neighbourhood?, description?, tags?, contactEmail? }
 * Stores a community dish suggestion as 'pending' (moderated before it surfaces
 * on the reverse-lookup page). Requires the reverse_lookup_suggestions table.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";

export const dynamic = "force-dynamic";
// Nhost can be slow after idle (cold start); the default function timeout killed
// requests mid-mutation — Hasura had already committed, so the client saw a
// "network error" yet the write succeeded. 60s lets the function wait it out.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const dishName = String(body.dishName ?? "").trim();
  const restaurantName = String(body.restaurantName ?? "").trim();
  if (!dishName || !restaurantName) {
    return NextResponse.json({ error: "Dish name and restaurant are required" }, { status: 400 });
  }

  const obj = {
    city: (String(body.city ?? "seattle").trim().toLowerCase() || "seattle"),
    dish_name: dishName,
    restaurant_name: restaurantName,
    neighbourhood: body.neighbourhood ? String(body.neighbourhood).trim() : null,
    description: body.description ? String(body.description).trim() : null,
    tags: Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === "string").slice(0, 12) : [],
    contact_email: body.contactEmail ? String(body.contactEmail).trim() : null,
  };

  try {
    const res = await graphql<{ insert_reverse_lookup_suggestions_one: { id: string } }>(
      `mutation ($obj: reverse_lookup_suggestions_insert_input!) {
         insert_reverse_lookup_suggestions_one(object: $obj) { id }
       }`,
      { useAdminSecret: true, variables: { obj } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't submit your suggestion right now" }, { status: 502 });
  }
}
