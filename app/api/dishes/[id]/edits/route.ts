import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { buildDishData } from "@/lib/dishes";
import { adminGuard } from "@/lib/admin";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 64 * 1024;

// POST — public: propose an edit to a dish. Stores a full, validated snapshot of
// the proposed recipe as a PENDING dish_edit. The live dish is NOT changed; an
// admin approves it later. Send the same body shape as create/edit, plus optional
// `editNote` (why you're suggesting the change).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const dishId = parseInt(params.id);
  if (!Number.isInteger(dishId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  // Merge the proposal over the current recipe, then validate the whole thing.
  let existing: any;
  try {
    const res = await graphql<{ dishes: Array<{ dish_data: any }> }>(
      `query ($id: Int!) { dishes(where: { id: { _eq: $id } }) { dish_data } }`,
      { useAdminSecret: true, variables: { id: dishId } }
    );
    existing = res.data?.dishes?.[0]?.dish_data;
    if (!existing) return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }

  let proposed;
  try { proposed = buildDishData({ ...existing, ...body }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }

  const proposer: Record<string, string> = {};
  const pn = typeof body?.submittedBy?.name === "string" ? body.submittedBy.name.trim() : "";
  const pe = typeof body?.submittedBy?.email === "string" ? body.submittedBy.email.trim() : "";
  if (pn) proposer.name = pn.slice(0, 120);
  if (pe) proposer.email = pe.slice(0, 254);
  const note = typeof body?.editNote === "string" ? body.editNote.trim().slice(0, 2000) || null : null;

  try {
    const res = await graphql<{ insert_dish_edits_one: { id: string } }>(
      `mutation AddEdit($dish_id: Int!, $data: jsonb!, $proposer: jsonb, $note: String) {
         insert_dish_edits_one(object: { dish_id: $dish_id, proposed_data: $data, proposer: $proposer, note: $note }) { id }
       }`,
      {
        useAdminSecret: true,
        variables: { dish_id: dishId, data: proposed, proposer: Object.keys(proposer).length ? proposer : null, note },
      }
    );
    if (res.errors?.length) {
      console.error("insert dish_edit failed:", res.errors);
      return NextResponse.json({ error: "Could not submit suggestion" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: res.data?.insert_dish_edits_one?.id });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}

// GET — admin: list edit proposals for this dish (any status).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = adminGuard(req);
  if (guard) return guard;
  const dishId = parseInt(params.id);
  if (!Number.isInteger(dishId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const res = await graphql<{ dish_edits: any[] }>(
      `query ($id: Int!) {
         dish_edits(where: { dish_id: { _eq: $id } }, order_by: { created_at: desc }) {
           id status proposed_data proposer note created_at reviewed_at
         }
       }`,
      { useAdminSecret: true, variables: { id: dishId } }
    );
    if (res.errors) return NextResponse.json({ error: "Failed to load" }, { status: 500 });
    return NextResponse.json({ edits: res.data?.dish_edits ?? [] });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
