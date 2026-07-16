import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { buildDishData } from "@/lib/dishes";

interface DishesQueryResult {
  dishes: Array<{
    id: number;
    dish_name: string;
    dish_data: any;
    created_at: string;
  }>;
  dishes_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export const dynamic = "force-dynamic";
// Nhost can be slow after idle (cold start); the default function timeout killed
// requests mid-mutation — Hasura had already committed, so the client saw a
// "network error" yet the write succeeded. 60s lets the function wait it out.
export const maxDuration = 60;
const MAX_BODY_BYTES = 32 * 1024;

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  let dishData;
  try { dishData = buildDishData(body ?? {}); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }

  // Get user ID from request headers (frontend sends it via X-User-Id)
  const userId = request.headers.get("x-user-id");
  if (userId) {
    dishData.user_id = userId;
  }

  try {
    const res = await graphql<{ insert_dishes_one: { id: number } }>(
      `mutation AddDish($name: String!, $data: jsonb!) {
         insert_dishes_one(object: { dish_name: $name, dish_data: $data }) { id }
       }`,
      { useAdminSecret: true, variables: { name: dishData.title as string, data: dishData } }
    );
    if (res.errors?.length) {
      console.error("insert dish failed:", res.errors);
      return NextResponse.json({ error: "Could not save recipe" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: res.data?.insert_dishes_one?.id });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 1000);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const search = url.searchParams.get("search") || "";

    // Fetch dishes with pagination and optional search using GraphQL
    const result = await graphql<DishesQueryResult>(
      `
        query GetDishes($limit: Int!, $offset: Int!, $searchTerm: String) {
          dishes(
            limit: $limit
            offset: $offset
            where: { dish_name: { _ilike: $searchTerm } }
            order_by: { created_at: desc }
          ) {
            id
            dish_name
            dish_data
            created_at
          }
          dishes_aggregate(where: { dish_name: { _ilike: $searchTerm } }) {
            aggregate {
              count
            }
          }
        }
      `,
      {
        useAdminSecret: true,
        variables: {
          limit,
          offset,
          searchTerm: search.trim() ? `%${search}%` : "%"
        }
      }
    );

    const total = result.data?.dishes_aggregate?.aggregate?.count || 0;

    return NextResponse.json({
      dishes: result.data?.dishes || [],
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching dishes:", error);
    return NextResponse.json(
      { error: "Failed to fetch dishes", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}