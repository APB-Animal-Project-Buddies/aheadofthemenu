/**
 * lib/agent-http.ts
 *
 * The auth → scope → rate-limit gate shared by every agent write endpoint, plus
 * the error taxonomy.
 *
 * Error CODES are a write-side concern only. On reads the failure set is 404 and
 * 500 and the HTTP status already says everything an agent needs; on writes an
 * agent must be able to tell "retry this" from "stop, you already did it",
 * which prose messages can't express. Human-readable `error` strings are kept
 * alongside so nothing regresses for the browser.
 */
import { NextResponse } from "next/server";
import { bearerToken } from "@/lib/jwt";
import { hasScope, verifyAgentKey, type AgentCaller, type AgentScope } from "@/lib/agent-keys";
import { consume, type LimitedEndpoint } from "@/lib/agent-limits";

export type ErrorCode =
  | "auth_required"
  | "invalid_key"
  | "insufficient_scope"
  | "rate_limited"
  | "restaurant_not_found"
  | "dish_not_found"
  | "dish_not_in_restaurant"
  | "possible_duplicate"
  | "already_commented"
  | "invalid_input"
  | "upstream_unavailable";

const STATUS: Record<ErrorCode, number> = {
  auth_required: 401,
  invalid_key: 401,
  insufficient_scope: 403,
  rate_limited: 429,
  restaurant_not_found: 404,
  dish_not_found: 404,
  dish_not_in_restaurant: 409,
  possible_duplicate: 409,
  already_commented: 409,
  invalid_input: 400,
  upstream_unavailable: 502,
};

export function fail(code: ErrorCode, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, code, ...extra }, { status: STATUS[code] });
}

export type Gate =
  | { ok: true; caller: AgentCaller; remaining: number }
  | { ok: false; response: NextResponse };

/**
 * Verifies the bearer key, checks the scope, and consumes one unit of the
 * endpoint's hourly budget — in that order, so an unauthenticated caller can
 * never burn a real key's quota.
 */
export async function gate(
  request: Request,
  scope: AgentScope,
  endpoint: LimitedEndpoint
): Promise<Gate> {
  const raw = bearerToken(request.headers.get("authorization"));
  if (!raw) {
    return { ok: false, response: fail("auth_required", "Provide an API key as a Bearer token.") };
  }

  let caller: AgentCaller | null;
  try {
    caller = await verifyAgentKey(raw);
  } catch {
    return {
      ok: false,
      response: fail("upstream_unavailable", "Couldn't verify your key right now."),
    };
  }
  if (!caller) {
    return { ok: false, response: fail("invalid_key", "That API key is not valid.") };
  }

  if (!hasScope(caller, scope)) {
    return {
      ok: false,
      response: fail("insufficient_scope", `This key is missing the "${scope}" scope.`, {
        requiredScope: scope,
      }),
    };
  }

  let limit;
  try {
    limit = await consume(caller.userId, endpoint);
  } catch {
    return {
      ok: false,
      response: fail("upstream_unavailable", "Couldn't check your rate limit right now."),
    };
  }
  if (!limit.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Rate limit reached for this account. Try again shortly.",
          code: "rate_limited",
          retryAfter: limit.retryAfter,
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      ),
    };
  }

  return { ok: true, caller, remaining: limit.remaining };
}

/** Body parsing with the same 32 KB ceiling the browser dish route uses. */
export const MAX_BODY_BYTES = 32 * 1024;

export async function readJson(request: Request): Promise<
  { ok: true; body: any } | { ok: false; response: NextResponse }
> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: fail("invalid_input", "Payload too large."),
    };
  }
  try {
    return { ok: true, body: JSON.parse(raw || "{}") };
  } catch {
    return { ok: false, response: fail("invalid_input", "Invalid JSON.") };
  }
}
