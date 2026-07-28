/**
 * GET /api/openapi.json — machine-readable companion to /llms.txt.
 *
 * Hand-written rather than generated: the surface is six endpoints, and a
 * generator would be more machinery than the problem needs. Keep it in step
 * when routes change.
 */
import { NextResponse } from "next/server";
import { ALL_SCOPES } from "@/lib/agent-keys";
import { HOURLY_LIMITS } from "@/lib/agent-limits";

export const dynamic = "force-static";

const uuid = { type: "string", format: "uuid" } as const;

const ERROR_SCHEMA = {
  type: "object",
  required: ["error", "code"],
  properties: {
    error: { type: "string", description: "Human-readable message." },
    code: {
      type: "string",
      description: "Stable machine-readable code. Branch on this, not the message.",
      enum: [
        "auth_required",
        "invalid_key",
        "insufficient_scope",
        "rate_limited",
        "restaurant_not_found",
        "dish_not_found",
        "dish_not_in_restaurant",
        "possible_duplicate",
        "already_commented",
        "invalid_input",
        "upstream_unavailable",
      ],
    },
    retryAfter: { type: "integer", description: "Seconds to wait (rate_limited only)." },
    candidates: {
      type: "array",
      description: "Existing venues that look like the one you tried to add (possible_duplicate only).",
      items: { $ref: "#/components/schemas/RestaurantRef" },
    },
  },
} as const;

const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

const WRITE_ERRORS = {
  "400": errorResponse("Invalid input."),
  "401": errorResponse("Missing or invalid API key."),
  "403": errorResponse("Key lacks the required scope."),
  "404": errorResponse("Referenced restaurant or dish does not exist."),
  "409": errorResponse("Conflict — see code."),
  "429": errorResponse("Per-key hourly rate limit reached."),
  "502": errorResponse("Upstream unavailable."),
};

const SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Ahead of the Menu — Eat This! API",
    version: "1.0.0",
    description:
      "Community catalogue of plant-based dishes orderable at restaurants. Reads are public; " +
      "writes need an API key created at https://www.aheadofthemenu.com/profile. " +
      "See https://www.aheadofthemenu.com/llms.txt for guidance written for agents.",
  },
  servers: [{ url: "https://www.aheadofthemenu.com" }],
  security: [{ apiKey: [] }],
  components: {
    securitySchemes: {
      apiKey: {
        type: "http",
        scheme: "bearer",
        description: `Bearer token of the form aotm_ak_… Scopes: ${ALL_SCOPES.join(", ")}. ` +
          `Hourly per-key limits: ${Object.entries(HOURLY_LIMITS)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}.`,
      },
    },
    schemas: {
      Error: ERROR_SCHEMA,
      RestaurantRef: {
        type: "object",
        properties: {
          id: uuid,
          name: { type: "string" },
          neighborhood: { type: ["string", "null"] },
        },
      },
      Score: {
        oneOf: [
          {
            type: "object",
            description: "Enough votes to publish a percentage.",
            required: ["state", "pct", "votes", "tier"],
            properties: {
              state: { const: "scored" },
              pct: { type: "integer", minimum: 0, maximum: 100 },
              votes: { type: "integer" },
              tier: { type: "string", examples: ["Top Bite", "Yum", "Tasty", "Meh", "Skip"] },
            },
          },
          {
            type: "object",
            description:
              "Too few votes to publish a percentage. There is deliberately no pct field — " +
              "do not infer one.",
            required: ["state", "votes"],
            properties: { state: { const: "tallying" }, votes: { type: "integer" } },
          },
          {
            type: "object",
            required: ["state"],
            properties: { state: { const: "empty" } },
          },
        ],
      },
      SearchResult: {
        type: "object",
        properties: {
          dishId: uuid,
          dish: { type: "string" },
          description: { type: ["string", "null"] },
          restaurantId: uuid,
          restaurant: { type: "string" },
          neighborhood: { type: ["string", "null"] },
          tags: { type: "array", items: { type: "string" } },
          availability: { type: "string", enum: ["permanent", "seasonal"] },
          score: { $ref: "#/components/schemas/Score" },
          url: { type: "string", format: "uri" },
        },
      },
    },
  },
  paths: {
    "/api/eat-this/search": {
      get: {
        summary: "Search live dishes",
        security: [],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Free text over dish, description, restaurant and tags." },
          { name: "neighborhood", in: "query", schema: { type: "string" } },
          { name: "tags", in: "query", schema: { type: "string" }, description: "Comma-separated; ALL must match." },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          "200": {
            description: "Ranked results — scored dishes first, then tallying, then unvoted.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    results: { type: "array", items: { $ref: "#/components/schemas/SearchResult" } },
                    total: { type: "integer" },
                    limit: { type: "integer" },
                    offset: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/eat-this/restaurants": {
      get: {
        summary: "Resolve a restaurant name to an id",
        description:
          "Call this before adding a dish or restaurant. Without it, agents create " +
          "near-duplicate venues.",
        security: [],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 200 } },
        ],
        responses: {
          "200": {
            description: "Substring matches first, then fuzzy matches.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    results: { type: "array", items: { $ref: "#/components/schemas/RestaurantRef" } },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/agent/eat-this/restaurants": {
      post: {
        summary: "Add a restaurant",
        description:
          "Fuzzy-checks the name first. A near match returns 409 possible_duplicate WITH " +
          "candidates; use one of their ids, or resend with confirmNew: true.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "address"],
                properties: {
                  name: { type: "string", maxLength: 120 },
                  address: { type: "string", maxLength: 300 },
                  neighborhood: { type: "string", maxLength: 80 },
                  website: { type: "string" },
                  cuisines: { type: "array", items: { type: "string" } },
                  description: { type: "string", maxLength: 500 },
                  confirmNew: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Created, or matched an existing venue exactly (existed: true).",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { const: true },
                    existed: { type: "boolean" },
                    restaurantId: uuid,
                  },
                },
              },
            },
          },
          ...WRITE_ERRORS,
        },
      },
    },
    "/api/agent/eat-this/dishes": {
      post: {
        summary: "Add a dish to an existing restaurant",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["restaurantId", "name"],
                properties: {
                  restaurantId: uuid,
                  name: { type: "string", maxLength: 120 },
                  description: { type: "string", maxLength: 500 },
                  tags: { type: "array", items: { type: "string" }, maxItems: 12 },
                  availability: { type: "string", enum: ["permanent", "seasonal"] },
                  customizations: { type: "array", items: { type: "string" }, maxItems: 20 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Created, or already present (existed: true). Idempotent.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { const: true },
                    existed: { type: "boolean" },
                    dishId: uuid,
                    restaurantId: uuid,
                    url: { type: ["string", "null"], format: "uri" },
                  },
                },
              },
            },
          },
          ...WRITE_ERRORS,
        },
      },
    },
    "/api/agent/eat-this/vote": {
      post: {
        summary: "Vote on a dish",
        description:
          "Both ids are required so a stale dish id fails loudly rather than voting on the " +
          "wrong dish. Upsert semantics: repeating a vote is idempotent.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["restaurantId", "dishId", "value"],
                properties: {
                  restaurantId: uuid,
                  dishId: uuid,
                  value: {
                    type: ["integer", "null"],
                    enum: [1, 0, -1, null],
                    description: "1 thumbs up, 0 neutral, -1 thumbs down, null clears.",
                  },
                  isLocal: { type: "boolean", default: true },
                  customizations: { type: "array", items: { type: "string" } },
                  orderType: { type: ["string", "null"], enum: ["in_person", "takeout", null] },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Vote recorded; fresh totals returned.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { const: true },
                    myVote: { type: ["integer", "null"] },
                    score: { $ref: "#/components/schemas/Score" },
                  },
                },
              },
            },
          },
          ...WRITE_ERRORS,
        },
      },
    },
    "/api/agent/eat-this/comments": {
      post: {
        summary: "Comment on a dish",
        description: "One comment per account per dish; a second returns 409 already_commented.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["restaurantId", "dishId", "body"],
                properties: {
                  restaurantId: uuid,
                  dishId: uuid,
                  body: { type: "string", maxLength: 600 },
                  visibility: {
                    type: "string",
                    enum: ["public", "private_to_restaurant"],
                    default: "public",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Comment posted.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { const: true }, commentId: uuid, url: { type: "string" } },
                },
              },
            },
          },
          ...WRITE_ERRORS,
        },
      },
    },
  },
};

export function GET() {
  return NextResponse.json(SPEC, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
