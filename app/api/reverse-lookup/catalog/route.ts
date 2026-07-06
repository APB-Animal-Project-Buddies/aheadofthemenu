/**
 * GET /api/reverse-lookup/catalog?city=seattle
 * The whole city catalog in one query: restaurants (+locations) and live
 * dishes with per-cohort vote totals. With a valid Bearer token, each dish
 * also carries the caller's own vote (myVote).
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { bearerToken, verifyNhostJwt } from "@/lib/jwt";
import { aggregateVotes } from "@/lib/reverse-lookup";

export const dynamic = "force-dynamic";
// Nhost cold starts can outlast the default function timeout; give it room.
export const maxDuration = 60;

type Row = {
  id: string; name: string; website: string | null; instagram: string | null;
  facebook: string | null; description: string | null; cuisines: string[];
  verified: boolean;
  locations: Array<{ id: string; address: string; neighborhood: string | null; phone: string | null }>;
  dishes: Array<{
    id: string; name: string; description: string | null; tags: unknown;
    details: unknown; created_at: string;
    created_by_user: { displayName: string | null; metadata: any } | null;
    votes: Array<{ user_id: string; value: number; voter_kind: string }>;
  }>;
};

export async function GET(request: NextRequest) {
  const city = (request.nextUrl.searchParams.get("city") ?? "seattle").toLowerCase();
  const token = bearerToken(request.headers.get("authorization"));
  const caller = verifyNhostJwt(token);

  try {
    const res = await graphql<{ restaurants: Row[] }>(
      `query ($city: String!) {
         restaurants(where: { city: { _eq: $city } }, order_by: { name: asc }) {
           id name website instagram facebook description cuisines verified
           locations(order_by: { created_at: asc }) { id address neighborhood phone }
           dishes(where: { status: { _eq: "live" } }) {
             id name description tags details created_at
             created_by_user { displayName metadata }
             votes { user_id value voter_kind }
           }
         }
       }`,
      { useAdminSecret: true, variables: { city } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);

    const restaurants = (res.data?.restaurants ?? []).map((r) => ({
      id: r.id, name: r.name, website: r.website, instagram: r.instagram,
      facebook: r.facebook, description: r.description, cuisines: r.cuisines,
      verified: r.verified, locations: r.locations, dishCount: r.dishes.length,
    }));

    const dishes = (res.data?.restaurants ?? []).flatMap((r) =>
      r.dishes.map((d) => {
        const { locals, visitors } = aggregateVotes(d.votes);
        const mine = caller ? d.votes.find((v) => v.user_id === caller.userId) : undefined;
        return {
          id: d.id,
          restaurantId: r.id,
          restaurantName: r.name,
          verified: r.verified,
          website: r.website,
          location: r.locations[0] ?? null,
          name: d.name,
          description: d.description,
          tags: Array.isArray(d.tags) ? d.tags : [],
          details: d.details ?? {},
          createdAt: d.created_at,
          addedBy: d.created_by_user?.metadata?.handle ?? d.created_by_user?.displayName ?? null,
          locals, visitors,
          myVote: mine ? { value: mine.value, isLocal: mine.voter_kind !== "visitor" } : null,
        };
      })
    );

    return NextResponse.json({ city, restaurants, dishes });
  } catch {
    return NextResponse.json({ error: "Couldn't load the catalog right now" }, { status: 502 });
  }
}
