/**
 * POST /api/eat-this/dishes/[id]/report  (Bearer auth required)
 * Body { reason, note? }. Files a problem report against a dish; queued for
 * admin review (no auto-hide). Idempotent: a duplicate open report from the
 * same user for the same reason returns ok (the partial-unique index blocks it).
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { bearerToken, verifyNhostJwt } from "@/lib/jwt";
import { validateReport } from "@/lib/reverse-lookup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const isDuplicate = (msg: string) => /unique|duplicate/i.test(msg);

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Sign in to report" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const input = validateReport(body);
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

  try {
    const res = await graphql<{ insert_restaurant_dish_reports_one: { id: string } | null }>(
      `mutation ($obj: restaurant_dish_reports_insert_input!) {
         insert_restaurant_dish_reports_one(object: $obj) { id }
       }`,
      {
        useAdminSecret: true,
        variables: { obj: { dish_id: params.id, user_id: caller.userId, reason: input.reason, note: input.note } },
      }
    );
    if (res.errors?.length) {
      const msg = res.errors[0].message;
      if (isDuplicate(msg)) return NextResponse.json({ ok: true, existed: true });
      if (/foreign key/i.test(msg)) return NextResponse.json({ error: "Dish not found" }, { status: 404 });
      throw new Error(msg);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't submit your report right now" }, { status: 502 });
  }
}
