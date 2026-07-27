/**
 * GET  /api/agent-keys   (Nhost Bearer) — list the caller's keys (never the secret)
 * POST /api/agent-keys   (Nhost Bearer) — mint a key; the raw value is returned ONCE
 *
 * Signed-in humans manage their own agent keys here. This endpoint is the whole
 * reason we don't need to be an OAuth authorization server: there is no third
 * party in the trust chain, just a user minting a credential for themselves.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { bearerToken, verifyNhostJwt } from "@/lib/jwt";
import {
  DEFAULT_SCOPES,
  generateKey,
  hashKey,
  sanitizeScopes,
} from "@/lib/agent-keys";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_KEYS_PER_USER = 10;

export async function GET(request: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Sign in to manage API keys" }, { status: 401 });

  try {
    const res = await graphql<{
      api_keys: Array<{
        id: string;
        name: string;
        scopes: string[] | null;
        expires_at: string | null;
        last_used_at: string | null;
        revoked_at: string | null;
        created_at: string;
      }>;
    }>(
      `query ($user: uuid!) {
         api_keys(where: { user_id: { _eq: $user } }, order_by: { created_at: desc }) {
           id name scopes expires_at last_used_at revoked_at created_at
         }
       }`,
      { useAdminSecret: true, variables: { user: caller.userId } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    return NextResponse.json({ keys: res.data?.api_keys ?? [] });
  } catch (error) {
    console.error("list api keys failed:", error);
    return NextResponse.json({ error: "Couldn't load your keys right now." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const caller = verifyNhostJwt(bearerToken(request.headers.get("authorization")));
  if (!caller) return NextResponse.json({ error: "Sign in to manage API keys" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim().slice(0, 60);
  if (!name) return NextResponse.json({ error: "Give the key a name." }, { status: 400 });

  const scopes = body?.scopes === undefined ? DEFAULT_SCOPES : sanitizeScopes(body.scopes);
  if (!scopes.length) {
    return NextResponse.json({ error: "Pick at least one scope." }, { status: 400 });
  }

  let expiresAt: string | null = null;
  if (body?.expiresInDays != null) {
    const days = Number(body.expiresInDays);
    if (!Number.isFinite(days) || days <= 0 || days > 365) {
      return NextResponse.json({ error: "expiresInDays must be 1–365." }, { status: 400 });
    }
    expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
  }

  try {
    const count = await graphql<{ api_keys_aggregate: { aggregate: { count: number } } }>(
      `query ($user: uuid!) {
         api_keys_aggregate(where: { user_id: { _eq: $user }, revoked_at: { _is_null: true } }) {
           aggregate { count }
         }
       }`,
      { useAdminSecret: true, variables: { user: caller.userId } }
    );
    if (count.errors?.length) throw new Error(count.errors[0].message);
    if ((count.data?.api_keys_aggregate?.aggregate?.count ?? 0) >= MAX_KEYS_PER_USER) {
      return NextResponse.json(
        { error: `You already have ${MAX_KEYS_PER_USER} active keys. Revoke one first.` },
        { status: 409 }
      );
    }

    const raw = generateKey();
    const res = await graphql<{ insert_api_keys_one: { id: string; created_at: string } | null }>(
      `mutation ($obj: api_keys_insert_input!) {
         insert_api_keys_one(object: $obj) { id created_at }
       }`,
      {
        useAdminSecret: true,
        variables: {
          obj: {
            user_id: caller.userId,
            name,
            key_hash: hashKey(raw),
            scopes,
            expires_at: expiresAt,
          },
        },
      }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);

    return NextResponse.json({
      ok: true,
      // Shown once. We store only the hash, so this can never be recovered.
      key: raw,
      id: res.data?.insert_api_keys_one?.id,
      name,
      scopes,
      expiresAt,
    });
  } catch (error) {
    console.error("create api key failed:", error);
    return NextResponse.json({ error: "Couldn't create that key right now." }, { status: 502 });
  }
}
