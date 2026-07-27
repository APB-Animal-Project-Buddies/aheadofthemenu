/**
 * GET /llms.txt — plain-language description of the Eat This! API for agents.
 *
 * The convention is a human-readable file an LLM can read directly, rather than
 * a spec it has to parse. The machine-readable companion is /api/openapi.json.
 */
import { NextResponse } from "next/server";
import { HOURLY_LIMITS } from "@/lib/agent-limits";
import { ALL_SCOPES } from "@/lib/agent-keys";
import { MIN_VOTES_TO_SCORE } from "@/lib/eat-this";

export const dynamic = "force-static";

const BODY = `# Ahead of the Menu — Eat This!

Eat This! is a community catalogue of plant-based dishes you can actually order at
restaurants, currently covering Seattle. Each dish carries a "Yum-Meter" score voted on by
locals and visitors.

Site: https://www.aheadofthemenu.com/eat-this

## Reading (no authentication)

GET /api/eat-this/search?q=&neighborhood=&tags=&limit=&offset=
    Search live dishes. \`tags\` is comma-separated. Returns ranked results, each with
    dishId, restaurantId, neighborhood, tags, a score, and a url you can cite.

GET /api/eat-this/restaurants?q=
    Resolve a restaurant name to an id. Substring matches first, then fuzzy matches.
    ALWAYS call this before adding a dish or a restaurant — it is what stops the
    catalogue filling up with "Plum Bistro", "Plum Bistro Seattle" and "Plum".

### Reading scores correctly

A dish score is one of three states:

  {"state": "scored", "pct": 91, "votes": 34, "tier": "Top Bite"}
  {"state": "tallying", "votes": 3}
  {"state": "empty"}

Below ${MIN_VOTES_TO_SCORE} votes there is deliberately NO percentage — early numbers anchor voters, so the
site withholds them. Do not compute or infer one from the vote count. Say "still tallying".

## Writing (API key required)

Writes need an API key. A signed-in user creates one at
https://www.aheadofthemenu.com/profile and pastes it into your configuration. Send it as:

    Authorization: Bearer aotm_ak_...

Every write is attributed to the user who owns the key, and is tagged as agent-written so
it can be reviewed or reversed.

POST /api/agent/eat-this/restaurants   scope eat-this:write
    { name, address, neighborhood?, website?, cuisines?, description?, confirmNew? }
    Returns 409 possible_duplicate WITH candidate venues if the name looks like an
    existing one. Use the candidate's id instead, or resend with confirmNew: true if it
    really is a different place.

POST /api/agent/eat-this/dishes        scope eat-this:write
    { restaurantId, name, description?, tags?, availability?, customizations? }
    restaurantId is required — resolve it first.

POST /api/agent/eat-this/vote          scope eat-this:vote
    { restaurantId, dishId, value, isLocal?, customizations?, orderType? }
    value is 1 (thumbs up), 0 (neutral), -1 (thumbs down), or null to clear your vote.
    Both ids are required so a stale dish id fails loudly instead of voting on the
    wrong dish.

POST /api/agent/eat-this/comments      scope eat-this:comment
    { restaurantId, dishId, body, visibility? }
    One comment per account per dish.

## Scopes

${ALL_SCOPES.map((s) => `  ${s}`).join("\n")}

Voting is off by default on new keys and must be enabled explicitly.

## Rate limits (per key, per hour)

${Object.entries(HOURLY_LIMITS)
  .map(([k, v]) => `  ${k.padEnd(16)} ${v}`)
  .join("\n")}

Exceeding a limit returns 429 with a \`retryAfter\` value in seconds. Honour it.

## Errors

Write failures return a stable \`code\` alongside a human \`error\` message. Branch on the
code, not the prose:

  auth_required, invalid_key, insufficient_scope, rate_limited, restaurant_not_found,
  dish_not_found, dish_not_in_restaurant, possible_duplicate, already_commented,
  invalid_input, upstream_unavailable

\`already_commented\` and \`possible_duplicate\` mean stop and reconsider, not retry.

## Please

This is a small community catalogue maintained by volunteers. Add dishes you have real
information about, vote only on dishes you have actually eaten, and prefer resolving an
existing venue over creating a new one.
`;

export function GET() {
  return new NextResponse(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
