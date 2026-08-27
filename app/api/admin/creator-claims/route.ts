import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { socialHandle } from "@/lib/creators";
import { adminGuard } from "@/lib/admin";

export const dynamic = "force-dynamic";
// Nhost can be slow after idle (cold start); the default function timeout killed
// requests mid-mutation — Hasura had already committed, so the client saw a
// "network error" yet the write succeeded. 60s lets the function wait it out.
export const maxDuration = 60;

// GET — admin: list creator claims (default: pending), joined with the creator
// and the claimant's identity, for the admin approval screen.
export async function GET(req: NextRequest) {
  const guard = adminGuard(req);
  if (guard) return guard;

  const status = new URL(req.url).searchParams.get("status") || "pending";
  try {
    const res = await graphql<{ creator_claims: any[] }>(
      `query ($status: String!) {
         creator_claims(where: { status: { _eq: $status } }, order_by: { created_at: asc }) {
           id status note created_at reviewed_at
           creator { id display_name slug website youtube instagram tiktok facebook twitter_x pinterest substack }
           user { displayName metadata }
         }
       }`,
      { useAdminSecret: true, variables: { status } }
    );
    if (res.errors) {
      console.error("list creator_claims failed:", res.errors);
      return NextResponse.json({ error: "Failed to load claims" }, { status: 500 });
    }
    // Hint for the reviewer, NOT verification: does the evidence link's handle
    // match one of the creator's known social handles? A typed URL proves
    // nothing by itself, so this only speeds up the eyeball check.
    const claims = (res.data?.creator_claims ?? []).map((c) => {
      const evidenceUrl = typeof c.note === "string" ? c.note.split("\n\n")[0]?.trim() : "";
      const ev = socialHandle(evidenceUrl)?.toLowerCase() ?? null;
      const platforms = ["youtube", "instagram", "tiktok", "facebook", "twitter_x", "pinterest", "substack", "website"] as const;
      const match = ev
        ? platforms.find((k) => socialHandle(c.creator?.[k])?.toLowerCase() === ev) ?? null
        : null;
      return { ...c, evidence_match: match ? { platform: match, handle: ev } : null };
    });
    return NextResponse.json({ claims });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
