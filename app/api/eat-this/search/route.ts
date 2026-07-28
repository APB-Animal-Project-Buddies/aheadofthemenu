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

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const city = (p.get("city") ?? "seattle").toLowerCase();
  const limit = parseLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
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
    const ranked = rankResults(filtered.map(toSearchResult));

    return NextResponse.json(
      {
        results: paginate(ranked, limit, offset),
        total: ranked.length,
        limit,
        offset,
      },
      {
        headers: {
          // Cache at the edge so repeat queries never reach Nhost. The catalog
          // changes on the order of minutes, not seconds.
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("eat-this search failed:", error);
    return NextResponse.json({ error: "Search is temporarily unavailable" }, { status: 502 });
  }
}
