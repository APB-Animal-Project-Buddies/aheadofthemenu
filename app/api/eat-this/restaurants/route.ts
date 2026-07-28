/**
 * GET /api/eat-this/restaurants?q=plum&limit=
 *
 * Name → id resolver. This is the endpoint that keeps the write path from
 * duplicating venues: an agent knows "Plum Bistro on 12th Ave", not a UUID, and
 * without a way to look one up it will take the create path and quietly add
 * "Plum Bistro Seattle" beside the existing "Plum Bistro".
 *
 * Unauthenticated and CDN-cached. With no `q` it returns the city's venues
 * alphabetically, so it doubles as a catalog listing.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { findDuplicateCandidates, parseLimit } from "@/lib/eat-this-agent";
import { normalize } from "@/lib/fuzzy";

export const maxDuration = 60;

type Row = {
  id: string;
  name: string;
  verified: boolean;
  locations: Array<{ neighborhood: string | null; address: string }>;
};

const QUERY = `query ($city: String!) {
  restaurants(where: { city: { _eq: $city } }, order_by: { name: asc }) {
    id name verified
    locations(order_by: { created_at: asc }, limit: 1) { neighborhood address }
  }
}`;

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const city = (p.get("city") ?? "seattle").toLowerCase();
  const q = (p.get("q") ?? "").trim();
  const limit = parseLimit(p.get("limit"), 20, 200);

  try {
    const res = await graphql<{ restaurants: Row[] }>(QUERY, {
      useAdminSecret: true,
      variables: { city },
    });
    if (res.errors?.length) throw new Error(res.errors[0].message);

    const all = (res.data?.restaurants ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      neighborhood: r.locations?.[0]?.neighborhood ?? null,
      address: r.locations?.[0]?.address ?? null,
      verified: r.verified,
    }));

    let results = all;
    if (q) {
      // Substring first (an agent typing "plum" means it), then fuzzy for
      // near-misses, preserving fuzzy's similarity ordering.
      const needle = normalize(q);
      const substring = all.filter((r) => normalize(r.name).includes(needle));
      const fuzzy = findDuplicateCandidates(q, all).filter(
        (c) => !substring.some((s) => s.id === c.id)
      );
      const byId = new Map(all.map((r) => [r.id, r]));
      results = [...substring, ...fuzzy.map((c) => byId.get(c.id)!).filter(Boolean)];
    }

    return NextResponse.json(
      { results: results.slice(0, limit), total: results.length },
      {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      }
    );
  } catch (error) {
    console.error("eat-this restaurant lookup failed:", error);
    return NextResponse.json({ error: "Lookup is temporarily unavailable" }, { status: 502 });
  }
}
