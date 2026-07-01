import { NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ results: [] });
  if (q.length > 60) return NextResponse.json({ error: "Query too long" }, { status: 400 });

  // Select `allergens` when the column exists; fall back gracefully if the
  // ingredient-allergens migration hasn't been applied yet (so search never breaks).
  const query = (fields: string) => `query Search($pat: String!) {
       ingredients(
         where: { _and: [ { search_text: { _ilike: $pat } }, { alias_of: { _is_null: true } } ] },
         limit: 40
       ) { ${fields} }
     }`;
  const vars = { useAdminSecret: true, variables: { pat: `%${q}%` } };
  type Row = { id: string; name: string; vegan: boolean | null; allergens?: string[] };
  let res = await graphql<{ ingredients: Row[] }>(query("id name vegan allergens"), vars);
  if (res.errors?.length) res = await graphql<{ ingredients: Row[] }>(query("id name vegan"), vars);
  if (res.errors?.length) return NextResponse.json({ error: "Search failed" }, { status: 502 });

  const rank = (n: string) => {
    const ln = n.toLowerCase();
    if (ln === q) return 0;
    if (ln.startsWith(q)) return 1;
    return 2;
  };
  const results = (res.data?.ingredients ?? [])
    .sort((a, b) => rank(a.name) - rank(b.name) || a.name.length - b.name.length)
    .slice(0, 10);
  return NextResponse.json({ results });
}
