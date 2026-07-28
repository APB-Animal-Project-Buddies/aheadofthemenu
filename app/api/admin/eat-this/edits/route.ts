/**
 * GET /api/admin/eat-this/edits?status=pending  (admin only, x-admin-secret)
 * Lists suggested edits to Eat This! dishes for the admin review tab, with each
 * dish's current fields (for the diff) and the proposer's handle.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { adminGuard } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STATUSES = ["pending", "approved", "rejected"];

export async function GET(req: NextRequest) {
  const guard = adminGuard(req);
  if (guard) return guard;
  const raw = new URL(req.url).searchParams.get("status") ?? "pending";
  const status = STATUSES.includes(raw) ? raw : "pending";

  try {
    const res = await graphql<{ restaurant_dish_edits: any[] }>(
      `query ($status: String!) {
         restaurant_dish_edits(where: { status: { _eq: $status } }, order_by: { created_at: desc }) {
           id status proposed note created_at reviewed_at
           dish { id name description tags availability }
           proposer { displayName metadata }
         }
       }`,
      { useAdminSecret: true, variables: { status } }
    );
    if (res.errors?.length) return NextResponse.json({ error: "Failed to load" }, { status: 500 });
    return NextResponse.json({ edits: res.data?.restaurant_dish_edits ?? [] });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
