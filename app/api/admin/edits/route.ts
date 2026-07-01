import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { adminGuard } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET — admin: list edit proposals (default: pending) across all dishes, with the
// current dish_data alongside the proposed_data so the UI can show a diff.
export async function GET(req: NextRequest) {
  const guard = adminGuard(req);
  if (guard) return guard;

  const status = new URL(req.url).searchParams.get("status") || "pending";
  try {
    const res = await graphql<{ dish_edits: any[] }>(
      `query ($status: String!) {
         dish_edits(where: { status: { _eq: $status } }, order_by: { created_at: asc }) {
           id dish_id status proposed_data proposer note created_at reviewed_at
           dish { id dish_name dish_data }
         }
       }`,
      { useAdminSecret: true, variables: { status } }
    );
    if (res.errors) {
      console.error("list dish_edits failed:", res.errors);
      return NextResponse.json({ error: "Failed to load proposals" }, { status: 500 });
    }
    return NextResponse.json({ edits: res.data?.dish_edits ?? [] });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
