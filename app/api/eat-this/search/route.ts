/**
 * GET /api/eat-this/search?q=&neighborhood=&tags=&limit=&offset=
 *
 * Retrieval-shaped read over the Eat This! catalog, for AI agents and any other
 * client that wants to ask a question rather than hydrate a page.
 *
 * The existing /api/eat-this/catalog returns every restaurant, every dish,
 * every raw vote row and 20 comments each, with no query parameter — fine for
 * booting the SPA, useless for "good vegan comfort food on Capitol Hill?".
 *
 * Unauthenticated and CDN-cached. Filtering happens in memory rather than in
 * SQL because tags are JSONB and neighborhood lives on restaurant_locations;
 * at the catalog's current size (~200 dishes) that is far simpler than the
 * equivalent Hasura predicate, and the cache means Nhost sees one query per
 * window regardless of traffic.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import {
  applyFilters,
  paginate,
  parseLimit,
  parseOffset,
  rankResults,
  toSearchResult,
  type SearchableDish,
} from "@/lib/eat-this-agent";
import { parseCoords } from "@/lib/geo";

export const maxDuration = 60; // Nhost cold starts outlast the default timeout.

type DishRow = {
  id: string;
  name: string;
  description: string | null;
  tags: unknown;
  availability: string;
  restaurant: {
    id: string;
    name: string;
    locations: Array<{ neighborhood: string | null }>;
  } | null;
  votes: Array<{ value: number; voter_kind: string; customizations: string[] | null }>;
};

const QUERY = `query ($city: String!) {
  restaurant_dishes(
    where: { status: { _eq: "live" }, restaurant: { city: { _eq: $city } } }
    order_by: { name: asc }
  ) {
    id name description tags availability
    restaurant {
      id name
      locations(order_by: { created_at: asc }, limit: 1) { neighborhood }
    }
    votes { value voter_kind customizations }
  }
}`;

/**
 * Distance ordering, computed by PostGIS.
 *
 * eat_this_dishes_near() is a tracked SQL function returning dish ids ordered
 * by ST_Distance from the caller's point, backed by a GiST index. It runs as a
 * SEPARATE query from the catalog fetch rather than as a join, so a failure
 * here — most likely the postgis extension not being enabled — degrades to
 * normal relevance ordering instead of taking the whole search down.
 *
 * Ungeocoded restaurants come back with distance_m = Infinity and sort last;
 * they are never dropped, which matters while the geocoding backfill is
 * incomplete.
 */
async function distanceOrder(
  city: string,
  origin: { lat: number; lng: number }
): Promise<Map<string, number> | null> {
  try {
    const res = await graphql<{
      eat_this_dishes_near: Array<{ dish_id: string; distance_m: number }>;
    }>(
      `query ($lat: float8!, $lng: float8!, $city: String!) {
         eat_this_dishes_near(args: { origin_lat: $lat, origin_lng: $lng, city_filter: $city }) {
           dish_id
           distance_m
         }
       }`,
      { useAdminSecret: true, variables: { lat: origin.lat, lng: origin.lng, city } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    const rows = res.data?.eat_this_dishes_near ?? [];
    return new Map(rows.map((r) => [r.dish_id, r.distance_m]));
  } catch (error) {
    console.error("eat-this distance ordering unavailable:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const city = (p.get("city") ?? "seattle").toLowerCase();
  const limit = parseLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  // Opt-in: no coordinates means the existing quality-first ranking is used.
  const origin = parseCoords(p.get("lat"), p.get("lng"));
  const tags = (p.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    const res = await graphql<{ restaurant_dishes: DishRow[] }>(QUERY, {
      useAdminSecret: true,
      variables: { city },
    });
    if (res.errors?.length) throw new Error(res.errors[0].message);

    const dishes: SearchableDish[] = (res.data?.restaurant_dishes ?? [])
      .filter((d): d is DishRow & { restaurant: NonNullable<DishRow["restaurant"]> } => !!d.restaurant)
      .map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        tags: d.tags,
        availability: d.availability,
        restaurantId: d.restaurant.id,
        restaurantName: d.restaurant.name,
        neighborhood: d.restaurant.locations?.[0]?.neighborhood ?? null,
        votes: d.votes ?? [],
      }));

    const filtered = applyFilters(dishes, {
      q: p.get("q"),
      neighborhood: p.get("neighborhood"),
      tags,
    });
    const shaped = filtered.map(toSearchResult);

    // Distance ordering replaces quality ordering when a point is supplied —
    // "nearest" and "best" are different questions, so they don't blend.
    const byDistance = origin ? await distanceOrder(city, origin) : null;
    const ranked = byDistance
      ? [...shaped]
          .map((r) => ({ ...r, distanceMeters: byDistance.get(r.dishId) ?? null }))
          .sort((a, b) => {
            const ad = a.distanceMeters ?? Infinity;
            const bd = b.distanceMeters ?? Infinity;
            return ad - bd || a.dish.localeCompare(b.dish);
          })
      : rankResults(shaped);

    return NextResponse.json(
      {
        results: paginate(ranked, limit, offset),
        total: ranked.length,
        limit,
        offset,
        sortedBy: byDistance ? "distance" : "relevance",
        // Told plainly, so a caller that asked for distance and silently got
        // relevance can tell the difference.
        ...(origin && !byDistance ? { note: "Distance ordering unavailable; sorted by relevance." } : {}),
      },
      {
        headers: {
          // Per-point results must not land in a shared edge cache — that would
          // serve one user's nearest-first list to the next. Only the
          // location-free response is cacheable.
          "Cache-Control": origin
            ? "private, no-store"
            : "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("eat-this search failed:", error);
    return NextResponse.json({ error: "Search is temporarily unavailable" }, { status: 502 });
  }
}
