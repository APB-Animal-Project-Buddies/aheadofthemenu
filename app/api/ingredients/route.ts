import { NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { normalize, slug, buildSearchText } from "@/lib/ingredients";

export const dynamic = "force-dynamic";
const MAX = 80;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 2048) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, MAX) : "";
  if (name.length < 2) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const id = `custom:${slug(name)}`;
  if (id === "custom:") return NextResponse.json({ error: "Invalid name" }, { status: 400 });

  const key = normalize(name);
  try {
    const found = await graphql<{ ingredients: Array<{ id: string; name: string; vegan: boolean | null }> }>(
      `query Find($k: String!) { ingredients(where: { norm_key: { _eq: $k } }, limit: 1) { id name vegan } }`,
      { useAdminSecret: true, variables: { k: key } }
    );
    if (found.errors?.length) return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
    const existing = found.data?.ingredients?.[0];
    if (existing) return NextResponse.json({ ingredient: existing, reused: true });

    const obj = {
      id, name, synonyms: [], norm_key: key,
      search_text: buildSearchText(name, []), source: "custom", vegan: null,
      added_ingredient: true,
    };
    const ins = await graphql<{ insert_ingredients_one: { id: string; name: string; vegan: boolean | null } | null }>(
      `mutation Add($obj: ingredients_insert_input!) {
         insert_ingredients_one(object: $obj,
           on_conflict: { constraint: ingredients_pkey, update_columns: [] }) { id name vegan }
       }`,
      { useAdminSecret: true, variables: { obj } }
    );
    if (ins.errors?.length) return NextResponse.json({ error: ins.errors[0]?.message }, { status: 500 });

    const created = ins.data?.insert_ingredients_one;
    if (created) return NextResponse.json({ ingredient: created, reused: false });

    // pkey conflict with update_columns:[] returns null — the row already exists; fetch and return it.
    const refetch = await graphql<{ ingredients: Array<{ id: string; name: string; vegan: boolean | null }> }>(
      `query Get($id: String!) { ingredients(where: { id: { _eq: $id } }, limit: 1) { id name vegan } }`,
      { useAdminSecret: true, variables: { id } }
    );
    return NextResponse.json({ ingredient: refetch.data?.ingredients?.[0] ?? null, reused: true });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
