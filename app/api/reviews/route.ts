import { NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { buildReviewData, isValidShortCode, parseDishTarget } from "@/lib/reviews";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 8 * 1024;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES)
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let body: any;
  try { body = JSON.parse(raw); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!isValidShortCode(body?.short_code))
    return NextResponse.json({ error: "Invalid short_code" }, { status: 400 });

  let dishId: number | null;
  try {
    const resolved = await graphql<{ short_urls: Array<{ target_type: string; target_id: string }> }>(
      `query Resolve($code: String!) {
         short_urls(where: { short_code: { _eq: $code } }, limit: 1) { target_type target_id }
       }`,
      { useAdminSecret: true, variables: { code: body.short_code } }
    );
    if (resolved.errors?.length)
      return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
    dishId = parseDishTarget(resolved.data?.short_urls?.[0]);
  } catch {
    // e.g. Nhost paused → empty 5xx body throws in graphql()
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
  if (dishId === null)
    return NextResponse.json({ error: "Unknown review link" }, { status: 404 });

  let reviewData;
  try { reviewData = buildReviewData(body?.review_data ?? {}); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }

  try {
    const result = await graphql<{ insert_reviews_one: { id: string } }>(
      `mutation InsertReview($dish_id: Int!, $review_data: jsonb!) {
         insert_reviews_one(object: { dish_id: $dish_id, review_data: $review_data }) { id }
       }`,
      { useAdminSecret: true, variables: { dish_id: dishId, review_data: reviewData } }
    );
    if (result.errors?.length)
      return NextResponse.json({ error: result.errors[0]?.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: result.data?.insert_reviews_one?.id });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
