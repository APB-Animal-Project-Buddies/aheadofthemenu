import { NextResponse } from "next/server";

// MVP admin gate: a shared secret (ADMIN_SECRET env) sent as the `x-admin-secret`
// header. Not per-user auth — good enough to gate the moderation actions until
// real auth is wired. If ADMIN_SECRET is unset, admin actions are denied.
export function isAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const provided = req.headers.get("x-admin-secret");
  return !!provided && provided === secret;
}

// Returns a 401 response when the caller isn't an admin, otherwise null.
export function adminGuard(req: Request): NextResponse | null {
  return isAdmin(req) ? null : NextResponse.json({ error: "Admin authorization required" }, { status: 401 });
}
