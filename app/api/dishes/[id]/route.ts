import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { buildDishData } from "@/lib/dishes";
import { adminGuard } from "@/lib/admin";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 32 * 1024;

export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const query = `
      query GetDish($id: Int!) {
        dishes(where: { id: { _eq: $id } }) {
          id
          dish_name
          dish_data
          created_at
        }
      }
    `;

        const result = await graphql<{ dishes: Array<Record<string, unknown>> }>(query, {
            useAdminSecret: true,
            variables: { id: parseInt(params.id) },
        });

        if (result.errors) {
            return NextResponse.json(
                { error: "Failed to fetch dish" },
                { status: 500 }
            );
        }

        const dish = result.data?.dishes[0];
        if (!dish) {
            return NextResponse.json(
                { error: "Dish not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(dish);
    } catch (error) {
        console.error("Error fetching dish:", error);
        return NextResponse.json(
            { error: "Failed to fetch dish" },
            { status: 500 }
        );
    }
}

// PATCH — partial edit. Send only the fields you're changing; they're shallow-merged
// over the stored recipe and the whole thing is re-validated through buildDishData,
// so the saved dish_data is always clean. Submitting a field empty/"" clears it.
// Note: nested objects (validation, submittedBy) are replaced wholesale if included.
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Direct edit is admin-only — non-admins go through propose → approve instead.
    const guard = adminGuard(req);
    if (guard) return guard;

    const id = parseInt(params.id);
    if (!Number.isInteger(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    let body: any;
    try { body = JSON.parse(raw); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return NextResponse.json({ error: "Body must be an object of fields to update" }, { status: 400 });
    }

    // Load the existing recipe so the client can send only the edited fields.
    let existing: any;
    try {
        const res = await graphql<{ dishes: Array<{ dish_data: any }> }>(
            `query GetDishData($id: Int!) { dishes(where: { id: { _eq: $id } }) { dish_data } }`,
            { useAdminSecret: true, variables: { id } }
        );
        if (res.errors?.length) {
            return NextResponse.json({ error: "Failed to load dish" }, { status: 500 });
        }
        existing = res.data?.dishes?.[0]?.dish_data;
        if (!existing) {
            return NextResponse.json({ error: "Dish not found" }, { status: 404 });
        }
    } catch {
        return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
    }

    // Merge edited fields over the stored recipe, then re-validate the whole dish.
    let dishData;
    try { dishData = buildDishData({ ...existing, ...body }); }
    catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }

    try {
        const res = await graphql<{ update_dishes: { affected_rows: number } }>(
            `mutation UpdateDish($id: Int!, $name: String!, $data: jsonb!) {
               update_dishes(where: { id: { _eq: $id } }, _set: { dish_name: $name, dish_data: $data }) {
                 affected_rows
               }
             }`,
            { useAdminSecret: true, variables: { id, name: dishData.title as string, data: dishData } }
        );
        if (res.errors?.length) {
            console.error("update dish failed:", res.errors);
            return NextResponse.json({ error: "Could not update recipe" }, { status: 500 });
        }
        if (!res.data?.update_dishes?.affected_rows) {
            return NextResponse.json({ error: "Dish not found" }, { status: 404 });
        }
        return NextResponse.json({ ok: true, id, dish: dishData });
    } catch {
        return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
    }
}