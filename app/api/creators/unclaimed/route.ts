/**
 * GET /api/creators/unclaimed — public: every claimable (owner_id IS NULL,
 * hidden = false) creator, for the /profile claim-search entry point. Small
 * table; the client fuzzy-filters via lib/fuzzy.ts, same as GET /api/creators
 * already does for the "original creator" datalist.
 */
import { NextResponse } from "next/server";
import { getUnclaimedCreators } from "@/lib/creators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const creators = await getUnclaimedCreators();
    return NextResponse.json({ creators });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
