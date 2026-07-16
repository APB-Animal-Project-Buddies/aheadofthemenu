/**
 * /api/products — branded, purchasable products. Products are stored IN the
 * ingredients table (is_branded_product = true), optionally linked to a generic
 * ingredient via parent_id, with buy/website links in the `metadata` JSONB.
 * This route presents them in a flat product shape:
 *   { id, product_name, purchase_link, ingredient_id }
 *
 *   GET  ?ingredientId=<id>&search=<q>  -> products, scoped to a generic ingredient
 *        (parent_id) and/or filtered by name. Both optional.
 *   POST { product_name, purchase_link, ingredient_id } -> add a branded product as
 *        an ingredient row (parent_id = ingredient_id, metadata.purchase_link = link).
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { normalize, slug, buildSearchText } from "@/lib/ingredients";

export const dynamic = "force-dynamic";
// Nhost can be slow after idle (cold start); the default function timeout killed
// requests mid-mutation — Hasura had already committed, so the client saw a
// "network error" yet the write succeeded. 60s lets the function wait it out.
export const maxDuration = 60;

const MAX_NAME = 200;
const MAX_URL = 500;

type IngredientRow = { id: string; name: string; parent_id: string | null; metadata: any };

/** Flatten an ingredients row (branded product) into the product shape the UI uses. */
function toProduct(r: IngredientRow) {
  return {
    id: r.id,
    product_name: r.name,
    purchase_link: r?.metadata?.purchase_link ?? "",
    ingredient_id: r.parent_id,
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ingredientId = url.searchParams.get("ingredientId")?.trim() || "";
    const search = url.searchParams.get("search")?.trim() || "";

    const and: Record<string, unknown>[] = [{ is_branded_product: { _eq: true } }];
    if (ingredientId) and.push({ parent_id: { _eq: ingredientId } });
    if (search) and.push({ name: { _ilike: `%${search}%` } });

    const res = await graphql<{ ingredients: IngredientRow[] }>(
      `query GetProducts($where: ingredients_bool_exp!) {
         ingredients(where: $where, order_by: { name: asc }, limit: 50) {
           id name parent_id metadata
         }
       }`,
      { useAdminSecret: true, variables: { where: { _and: and } } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    return NextResponse.json({ products: (res.data?.ingredients ?? []).map(toProduct) });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const product_name = String(body?.product_name ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME);
  const ingredient_id = String(body?.ingredient_id ?? "").trim() || null;
  let purchase_link = String(body?.purchase_link ?? "").trim().slice(0, MAX_URL);

  if (!product_name) return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  if (purchase_link && !/^https?:\/\//i.test(purchase_link)) purchase_link = `https://${purchase_link}`;
  if (!/^https?:\/\/[^\s]+\.[^\s]+/i.test(purchase_link)) {
    return NextResponse.json({ error: "That doesn't look like a valid purchase link." }, { status: 400 });
  }

  // Deterministic id scoped to (parent, name) so re-adding the same product dedupes.
  const id = `product:${ingredient_id ? `${ingredient_id}:` : ""}${slug(product_name)}`;
  const obj = {
    id,
    name: product_name,
    synonyms: [],
    norm_key: normalize(product_name),
    search_text: buildSearchText(product_name, []),
    source: "product",
    vegan: null,
    is_branded_product: true,
    parent_id: ingredient_id,
    metadata: { purchase_link },
  };

  try {
    const res = await graphql<{ insert_ingredients_one: IngredientRow | null }>(
      `mutation AddProduct($obj: ingredients_insert_input!) {
         insert_ingredients_one(
           object: $obj,
           on_conflict: { constraint: ingredients_pkey, update_columns: [metadata, parent_id] }
         ) { id name parent_id metadata }
       }`,
      { useAdminSecret: true, variables: { obj } }
    );
    if (res.errors?.length) {
      const msg = res.errors[0].message;
      if (/foreign key|violates/i.test(msg)) {
        return NextResponse.json({ error: "Unknown ingredient for this product." }, { status: 400 });
      }
      throw new Error(msg);
    }
    const row = res.data?.insert_ingredients_one;
    return NextResponse.json({ product: row ? toProduct(row) : null });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
