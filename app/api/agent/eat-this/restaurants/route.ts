/**
 * POST /api/agent/eat-this/restaurants   (API key, scope eat-this:write)
 *
 * Adds a venue. This is the highest-risk write for catalog quality, so it does
 * a fuzzy pre-check the browser path doesn't: the inline-create in
 * app/api/eat-this/dishes/route.ts dedupes on an exact `_ilike` name match,
 * which catches "Plum Bistro" twice but not "Plum Bistro Seattle" or "Plum".
 * Agents produce exactly that kind of near-miss.
 *
 * On a near match we return 409 possible_duplicate WITH the candidates — an
 * agent can act on "did you mean Plum Bistro (id …)?" but not on a bare error.
 * Send { confirmNew: true } to create anyway.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { fail, gate, readJson } from "@/lib/agent-http";
import { findDuplicateCandidates, findExactMatch } from "@/lib/eat-this-agent";
import { strList } from "@/lib/eat-this";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

type Existing = {
  id: string;
  name: string;
  locations: Array<{ neighborhood: string | null }>;
};

export async function POST(request: NextRequest) {
  const g = await gate(request, "eat-this:write", "add_restaurant");
  if (!g.ok) return g.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const name = str(body?.name, 120);
  const address = str(body?.address, 300);
  if (!name) return fail("invalid_input", "A restaurant name is required.");
  if (!address) return fail("invalid_input", "A street address is required.");

  const city = (str(body?.city, 40) || "seattle").toLowerCase();
  const neighborhood = str(body?.neighborhood, 80) || null;
  let website = str(body?.website, 300) || null;
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  const cuisines = strList(body?.cuisines, 40, 12);
  const description = str(body?.description, 500) || null;

  try {
    const existingRes = await graphql<{ restaurants: Existing[] }>(
      `query ($city: String!) {
         restaurants(where: { city: { _eq: $city } }) {
           id name
           locations(order_by: { created_at: asc }, limit: 1) { neighborhood }
         }
       }`,
      { useAdminSecret: true, variables: { city } }
    );
    if (existingRes.errors?.length) throw new Error(existingRes.errors[0].message);

    const existing = (existingRes.data?.restaurants ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      neighborhood: r.locations?.[0]?.neighborhood ?? null,
    }));

    // An exact name collision is always a reuse, never a suggestion — mirrors
    // the browser path's idempotent { existed: true } rather than 409ing.
    const exact = findExactMatch(name, existing);
    if (exact) {
      return NextResponse.json({
        ok: true,
        existed: true,
        restaurantId: exact.id,
        restaurant: { id: exact.id, name: exact.name, neighborhood: exact.neighborhood },
      });
    }

    if (body?.confirmNew !== true) {
      const candidates = findDuplicateCandidates(name, existing);
      if (candidates.length) {
        return fail(
          "possible_duplicate",
          `"${name}" looks like an existing venue. Use its id, or resend with confirmNew: true.`,
          { candidates: candidates.slice(0, 5) }
        );
      }
    }

    const res = await graphql<{ insert_restaurants_one: { id: string } | null }>(
      `mutation ($obj: restaurants_insert_input!) {
         insert_restaurants_one(object: $obj) { id }
       }`,
      {
        useAdminSecret: true,
        variables: {
          obj: {
            city,
            name,
            website,
            description,
            cuisines,
            created_by: g.caller.userId,
            source: "agent",
            api_key_id: g.caller.apiKeyId,
            // Agent-created venues are never auto-verified; they surface for
            // moderation the same way any unverified venue does.
            verified: false,
            locations: { data: [{ address, neighborhood }] },
          },
        },
      }
    );

    if (res.errors?.length) {
      const msg = res.errors[0].message;
      // The (city, lower(name)) unique index can still fire on a race. Re-query
      // rather than consulting `existing` — that snapshot predates the insert,
      // so by definition it does NOT contain the row that just collided, and
      // searching it would hand back { existed: true, restaurantId: null }.
      if (/unique|duplicate/i.test(msg)) {
        const raced = await graphql<{ restaurants: Array<{ id: string; name: string }> }>(
          `query ($city: String!, $name: String!) {
             restaurants(where: { city: { _eq: $city }, name: { _ilike: $name } }, limit: 1) { id name }
           }`,
          {
            useAdminSecret: true,
            variables: { city, name: name.replace(/[\\%_]/g, (m) => `\\${m}`) },
          }
        );
        const id = raced.data?.restaurants?.[0]?.id ?? null;
        if (!id) throw new Error(msg);
        return NextResponse.json({ ok: true, existed: true, restaurantId: id });
      }
      throw new Error(msg);
    }

    const id = res.data?.insert_restaurants_one?.id ?? null;
    return NextResponse.json({
      ok: true,
      existed: false,
      restaurantId: id,
      rateLimitRemaining: g.remaining,
    });
  } catch (error) {
    console.error("agent add restaurant failed:", error);
    return fail("upstream_unavailable", "Couldn't add that restaurant right now.");
  }
}
