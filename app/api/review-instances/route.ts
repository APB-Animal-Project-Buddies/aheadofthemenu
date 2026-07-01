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
 *   notes?: string
 * }
 *
 * Response: { code: string, path: string }   // path = "/s/{code}"
 */

import { NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";

export const dynamic = "force-dynamic";

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

    const baseVars = {
      id: code,
      dishId,
      name: String(body.name).trim(),
      chefType: body.chefType,
      eventContext: body.eventContext ? String(body.eventContext).trim() : null,
      difficulty,
      notes: body.notes ? String(body.notes).trim() : null,
    };

    // 1) Save the review instance. Include substituted/allergens when those columns
    //    exist; fall back to the base insert if the migration hasn't been applied.
    const doInsert = (withSub: boolean) =>
      graphql<{ insert_review_instance_one: { id: string } }>(
        `mutation (
           $id: bpchar!, $dishId: Int!, $name: String!, $chefType: String!,
           $eventContext: String, $difficulty: Int!, $notes: String${withSub ? ", $substituted: Boolean!, $allergens: [String!]!, $substitutions: jsonb!" : ""}
         ) {
           insert_review_instance_one(object: {
             id: $id, dish_id: $dishId, name: $name, chef_type: $chefType,
             event_context: $eventContext, difficulty: $difficulty, notes: $notes${withSub ? ", substituted: $substituted, allergens: $allergens, substitutions: $substitutions" : ""}
           }) { id }
         }`,
        { useAdminSecret: true, variables: withSub ? { ...baseVars, substituted, allergens, substitutions } : baseVars }
      );

    let insertInstance = await doInsert(true);
    if (insertInstance.errors?.length) insertInstance = await doInsert(false);
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
