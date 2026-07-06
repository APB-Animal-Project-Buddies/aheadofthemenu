/**
 * POST /api/review-instances
 *
 * Creates a review instance (the creator's context for who/what a review link
 * is for) AND mints a matching short URL so the link can be shared. The
 * review_instance row and the short_urls row share the same 6-char code, so the
 * saved context and the shareable link are correlated by a single id.
 *
 * The link itself opens the existing reviewer rating form at /s/{code}.
 *
 * Request body:
 * {
 *   dishId: number,
 *   name: string,
 *   chefType: "beginner" | "homecook" | "professional",
 *   eventContext?: string,
 *   difficulty: number (1-5),
 *   notes?: string,
 *   public?: boolean   // literal true publishes the instance on the dish page
 * }
 *
 * Response: { code: string, path: string }   // path = "/s/{code}"
 */

import { NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { instanceVisibility } from "@/lib/reviews";

export const dynamic = "force-dynamic";
// Nhost can be slow after idle (cold start); the default function timeout killed
// requests mid-mutation — Hasura had already committed, so the client saw a
// "network error" yet the write succeeded. 60s lets the function wait it out.
export const maxDuration = 60;

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LEN = 6;

function randomCode(): string {
  // Math.random is fine here: codes are uniqueness-checked, not security tokens.
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

async function codeExists(code: string): Promise<boolean> {
  const res = await graphql<{ short_urls: Array<{ short_code: string }> }>(
    `query ($c: String!) {
       short_urls(where: { short_code: { _eq: $c } }, limit: 1) { short_code }
     }`,
    { useAdminSecret: true, variables: { c: code } }
  );
  if (res.errors?.length) throw new Error("Lookup failed");
  return (res.data?.short_urls?.length ?? 0) > 0;
}

async function allocateCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const c = randomCode();
    if (!(await codeExists(c))) return c;
  }
  throw new Error("Could not allocate a unique code");
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dishId = Number(body?.dishId);
  if (!Number.isInteger(dishId) || dishId <= 0) {
    return NextResponse.json({ error: "Invalid or missing dishId" }, { status: 400 });
  }
  if (!body?.name || !String(body.name).trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!["beginner", "homecook", "professional"].includes(body?.chefType)) {
    return NextResponse.json({ error: "Invalid chef type" }, { status: 400 });
  }
  const difficulty = Number(body?.difficulty);
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    return NextResponse.json({ error: "Difficulty must be between 1 and 5" }, { status: 400 });
  }

  try {
    // Make sure the dish exists before creating anything for it.
    const dishRes = await graphql<{ dishes: Array<{ id: number }> }>(
      `query ($id: Int!) { dishes(where: { id: { _eq: $id } }, limit: 1) { id } }`,
      { useAdminSecret: true, variables: { id: dishId } }
    );
    if (dishRes.errors?.length) return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
    if (!dishRes.data?.dishes?.length) {
      return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    }

    const code = await allocateCode();

    // Substitutions can change the allergen profile — capture whether the cook
    // substituted and the allergens of their version (reprompted in the UI).
    const substituted = body?.substituted === true;
    const allergens: string[] = substituted && Array.isArray(body?.allergens)
      ? body.allergens.filter((a: unknown) => typeof a === "string").map((a: string) => a.trim()).filter(Boolean).slice(0, 30)
      : [];
    const substitutions = substituted && Array.isArray(body?.substitutions)
      ? body.substitutions.slice(0, 50)
      : [];
    const visibility = instanceVisibility(body?.public);

    const baseVars = {
      id: code,
      dishId,
      name: String(body.name).trim(),
      chefType: body.chefType,
      eventContext: body.eventContext ? String(body.eventContext).trim() : null,
      difficulty,
      notes: body.notes ? String(body.notes).trim() : null,
    };

    // Active-review window (auto-expires after 24h) + author (the signed-in
    // creator, if any — passed via X-User-Id like the dish-submit flow).
    const activeUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const authorId = request.headers.get("x-user-id") || null;
    const extraVars = { ...baseVars, substituted, allergens, substitutions, activeUntil, authorId, visibility };

    // 1) Save the review instance. Degrade column-set by column-set so a
    //    missing migration only costs its own columns, never its siblings:
    //    full (extended + visibility) → extended (substituted/allergens/
    //    substitutions/active_until/author_id) → base. Each step is logged —
    //    a silent fallback is indistinguishable from success in every UI.
    const doInsert = (withExtra: boolean, withVisibility: boolean) =>
      graphql<{ insert_review_instance_one: { id: string } }>(
        `mutation (
           $id: bpchar!, $dishId: Int!, $name: String!, $chefType: String!,
           $eventContext: String, $difficulty: Int!, $notes: String${withExtra ? ", $substituted: Boolean!, $allergens: [String!]!, $substitutions: jsonb!, $activeUntil: timestamptz, $authorId: uuid" : ""}${withExtra && withVisibility ? ", $visibility: String" : ""}
         ) {
           insert_review_instance_one(object: {
             id: $id, dish_id: $dishId, name: $name, chef_type: $chefType,
             event_context: $eventContext, difficulty: $difficulty, notes: $notes${withExtra ? ", substituted: $substituted, allergens: $allergens, substitutions: $substitutions, active_until: $activeUntil, author_id: $authorId" : ""}${withExtra && withVisibility ? ", visibility: $visibility" : ""}
           }) { id }
         }`,
        // Unknown variables in the payload are ignored, so extraVars is safe
        // for both extended shapes.
        { useAdminSecret: true, variables: withExtra ? extraVars : baseVars }
      );

    let insertInstance = await doInsert(true, true);
    if (insertInstance.errors?.length) {
      console.warn(
        `review-instance insert: visibility column rejected (migration applied? metadata reloaded?) — retrying without it. Requested visibility=${visibility}.`,
        insertInstance.errors[0]?.message
      );
      insertInstance = await doInsert(true, false);
    }
    if (insertInstance.errors?.length) {
      console.warn(
        "review-instance insert: extended columns rejected — falling back to base insert (drops substituted/allergens/substitutions/active_until/author_id).",
        insertInstance.errors[0]?.message
      );
      insertInstance = await doInsert(false, false);
    }
    if (insertInstance.errors?.length) {
      return NextResponse.json(
        { error: insertInstance.errors[0]?.message ?? "Failed to create review instance" },
        { status: 500 }
      );
    }

    // 2) Mint the matching short URL so /s/{code} opens the reviewer's rating form.
    const insertUrl = await graphql<{ insert_short_urls_one: { short_code: string } }>(
      `mutation ($code: String!, $tid: String!) {
         insert_short_urls_one(
           object: { short_code: $code, target_type: "dish_review", target_id: $tid }
         ) { short_code }
       }`,
      { useAdminSecret: true, variables: { code, tid: String(dishId) } }
    );
    if (insertUrl.errors?.length) {
      return NextResponse.json(
        { error: insertUrl.errors[0]?.message ?? "Failed to create review link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ code, path: `/s/${code}` });
  } catch {
    // e.g. Nhost paused → empty 5xx body throws in graphql()
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
