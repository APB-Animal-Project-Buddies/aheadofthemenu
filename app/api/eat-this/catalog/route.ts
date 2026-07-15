/**
 * GET /api/eat-this/catalog?city=seattle
 * The whole city catalog in one query: restaurants (+locations) and live
 * dishes with per-cohort vote totals. With a valid Bearer token, each dish
 * also carries the caller's own vote (myVote).
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql, nhost } from "@/lib/nhost";
import { bearerToken, verifyNhostJwt } from "@/lib/jwt";
import { aggregateVotes, aggregateByCustomization } from "@/lib/reverse-lookup";

const fileUrl = (fileId: string) => `${nhost.storageUrl}/files/${fileId}`;

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
    details: unknown; availability: string; customizations: unknown; created_at: string;
    created_by_user: { displayName: string | null; metadata: any } | null;
    votes: Array<{ user_id: string; value: number; voter_kind: string; customizations: string[] | null; order_type: string | null }>;
    photos: Array<{ id: string; file_id: string; caption: string | null; uploader_id: string | null }>;
    comments: Array<{ id: string; body: string; created_at: string; author: { displayName: string | null; metadata: any } | null; likes?: Array<{ user_id: string }> }>;
  }>;
};

// `likes` on comments only exists once the comment-likes migration is applied.
// GET tries with it, then falls back without it, so the catalog never 502s
// during the migration window (likes just read as 0 until then).
const catalogQuery = (withLikes: boolean) => `query ($city: String!) {
  restaurants(where: { city: { _eq: $city } }, order_by: { name: asc }) {
    id name website instagram facebook description cuisines verified
    locations(order_by: { created_at: asc }) { id address neighborhood phone }
    dishes(where: { status: { _eq: "live" } }) {
      id name description tags details availability customizations created_at
      created_by_user { displayName metadata }
      votes { user_id value voter_kind customizations order_type }
      photos(order_by: { created_at: asc }) { id file_id caption uploader_id }
      comments(where: { visibility: { _eq: "public" } }, order_by: { created_at: desc }, limit: 20) {
        id body created_at author { displayName metadata }
        ${withLikes ? "likes { user_id }" : ""}
      }
    }
  }
}`;

export async function GET(request: NextRequest) {
  const city = (request.nextUrl.searchParams.get("city") ?? "seattle").toLowerCase();
  const token = bearerToken(request.headers.get("authorization"));
  const caller = verifyNhostJwt(token);

  try {
    let res = await graphql<{ restaurants: Row[] }>(
      catalogQuery(true), { useAdminSecret: true, variables: { city } }
    );
    // Only fall back for the "comment_likes not applied yet" case — don't let the
    // fallback mask unrelated errors (which would silently drop likes on a 200).
    if (res.errors?.length && /likes|not found|unknown|does not exist/i.test(res.errors[0].message)) {
      res = await graphql<{ restaurants: Row[] }>(
        catalogQuery(false), { useAdminSecret: true, variables: { city } }
      );
    }
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
          availability: d.availability === "seasonal" ? "seasonal" : "permanent",
          customizations: Array.isArray(d.customizations) ? d.customizations : [],
          createdAt: d.created_at,
          addedBy: d.created_by_user?.metadata?.handle ?? d.created_by_user?.displayName ?? null,
          locals, visitors,
          byCustomization: aggregateByCustomization(d.votes),
          myVote: mine ? { value: mine.value > 0 ? 1 : mine.value < 0 ? -1 : 0, isLocal: mine.voter_kind !== "visitor", customizations: mine.customizations ?? [], orderType: mine.order_type === "in_person" || mine.order_type === "takeout" ? mine.order_type : null } : null,
          photos: (d.photos ?? []).map((p) => ({
            id: p.id, url: fileUrl(p.file_id), caption: p.caption, uploaderId: p.uploader_id,
          })),
          comments: (d.comments ?? []).map((c) => ({
            id: c.id, body: c.body, createdAt: c.created_at,
            author: c.author?.metadata?.handle ?? c.author?.displayName ?? null,
            likeCount: (c.likes ?? []).length,
            likedByMe: caller ? (c.likes ?? []).some((l) => l.user_id === caller.userId) : false,
          })),
        };
      })
    );

    return NextResponse.json({ city, restaurants, dishes });
  } catch {
    return NextResponse.json({ error: "Couldn't load the catalog right now" }, { status: 502 });
  }
}
