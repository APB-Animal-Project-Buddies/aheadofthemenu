/**
 * /api/creators — recipe creators behind the "Original creator" field.
 *
 *   GET  -> full list for the autocomplete (small table; the native datalist
 *           filters client-side as the user types).
 *   POST -> add a missing creator: { website, name?, creatorName? } with at
 *           least one of name/creatorName. Rows land unclaimed (owner_id
 *           NULL), same as the seeded ones.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";

export const dynamic = "force-dynamic";
// Nhost can be slow after idle (cold start); the default function timeout killed
// requests mid-mutation — Hasura had already committed, so the client saw a
// "network error" yet the write succeeded. 60s lets the function wait it out.
export const maxDuration = 60;

type Creator = { display_name: string; creator_name: string | null };

export async function GET() {
  try {
    const res = await graphql<{ creators: Creator[] }>(
      `query { creators(order_by: { display_name: asc }) { display_name creator_name } }`,
      { useAdminSecret: true }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    return NextResponse.json({ creators: res.data?.creators ?? [] });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim().slice(0, 120);
  const creatorName = String(body?.creatorName ?? "").trim().slice(0, 120);
  let website = String(body?.website ?? "").trim().slice(0, 300);

  if (!name && !creatorName) {
    return NextResponse.json({ error: "Give at least a name or a creator name." }, { status: 400 });
  }
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (website && !/^https?:\/\/[^\s]+\.[^\s]+/i.test(website)) {
    return NextResponse.json({ error: "That doesn't look like a valid website." }, { status: 400 });
  }

  // The person's name headlines the row; fall back to the brand when the
  // person wasn't given (matches how the seeds are shaped).
  const displayName = name || creatorName;
  try {
    const res = await graphql<{ insert_creators_one: { id: string; display_name: string } | null }>(
      `mutation ($dn: String!, $cn: String, $web: String) {
         insert_creators_one(object: { display_name: $dn, creator_name: $cn, website: $web }) { id display_name }
       }`,
      { useAdminSecret: true, variables: { dn: displayName, cn: creatorName || null, web: website || null } }
    );
    if (res.errors?.length) {
      const msg = res.errors[0].message;
      if (/unique|duplicate/i.test(msg)) {
        // Already in the list — treat as success so a retry after a dropped
        // response (Nhost cold start, killed function) doesn't dead-end the
        // user even though the first attempt committed.
        const existing = await graphql<{ creators: Array<{ id: string; display_name: string }> }>(
          `query ($dn: String!) {
             creators(where: { display_name: { _ilike: $dn } }, limit: 1) { id display_name }
           }`,
          // Escape LIKE wildcards so _ilike is an exact case-insensitive match.
          { useAdminSecret: true, variables: { dn: displayName.replace(/[\\%_]/g, (m) => `\\${m}`) } }
        );
        return NextResponse.json({ ok: true, creator: existing.data?.creators?.[0] ?? null, existed: true });
      }
      throw new Error(msg);
    }
    return NextResponse.json({ ok: true, creator: res.data?.insert_creators_one });
  } catch {
    return NextResponse.json({ error: "Couldn't add the creator right now." }, { status: 502 });
  }
}
