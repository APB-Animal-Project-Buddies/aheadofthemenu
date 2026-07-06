# Reverse Lookup v2 — Design

**Date:** 2026-07-05
**Status:** Approved by user (pending spec review)

## Purpose

Turn the static reverse-lookup page (`public/reverse-lookup/`, CDN React + static
`seattle.json`) into a database-backed, community-driven catalog inside the Next
app. Diners search for a vegan dish they're craving and see which local
restaurants serve it; signed-in users add dishes and vote them up or down.

User requirements driving this:

1. People can add dishes and give them a thumbs up / thumbs down.
2. Adding a dish at an unlisted venue lets the user enter the restaurant's
   name and address inline.
3. Voting (and adding) requires being signed in.

Decisions made with the user:

- Votes attach to a **dish at a specific restaurant**, not a dish concept.
- Signed-in additions go **live immediately** (no moderation queue); an admin
  `hidden` status is the killswitch. Anonymous users cannot add or vote.
- Users **can create restaurants inline** while adding a dish. CSV-seeded
  venues are flagged `verified`; user-created ones are not.

## The core loop

Crave → search → see where → trust it (votes) → contribute (add/vote). Every UI
element serves one of those verbs.

## UX

### Page `/reverse-lookup` (app router)

The static page retires; a real app-router page replaces it at the same URL,
using the site's Tailwind design system, shared header, and Nhost auth session.

Cold-start reality: the seed provides ~26 restaurants but only a handful of
dishes. A dishes-only page would look empty, so the page has **two tabs sharing
one search box**:

- **Dishes** — dish@restaurant cards, sorted by net votes desc, then newest.
  Same-named dishes at different venues are separate cards; search groups them
  adjacently by name.
- **Restaurants** — directory of all venues (cuisine types, neighborhoods,
  addresses, description). Every restaurant card ends with "Know their menu?
  + Add a dish" — the directory doubles as the contribution funnel.

Layout (mobile-first, mirrors the sticky filter header pattern on `/dishes`):

```
┌──────────────────────────────────────────────────┐
│  Reverse Lookup · Seattle                        │
│  Tell us what you're craving — we'll tell you    │
│  where to find it vegan.                         │
│  ┌────────────────────────────────────────────┐  │
│  │ 🔍  Try "pad thai", "donut", "Ballard"…    │  │  ← search is the hero
│  └────────────────────────────────────────────┘  │
│  [ Dishes (12) ]  [ Restaurants (26) ]   [+ Add] │
├──────────────────────────────────────────────────┤
│  Category: (All) (breakfast) (dessert) (drink)…  │  ← sticky on scroll
└──────────────────────────────────────────────────┘
```

Search matches dish name, description, tags, ingredients (from `details`),
restaurant name, and neighborhood — token-AND semantics, ported from the
current static app.

### Dish card

```
┌──────────────────────────────────────────────────┐
│  Vegan Katsu Curry              (savoury)        │
│  at Plum Bistro · Capitol Hill    [verified ✓]   │
│  Crispy panko tofu over rich curry rice.         │
│  📍 1429 12th Ave, Seattle    ↗ website          │
│  Was it good?   [ 👍 14 ]  [ 👎 2 ]              │
│  added by @handle                                │
└──────────────────────────────────────────────────┘
```

- The vote widget is labeled ("Was it good?") so the affordance is instantly
  legible. The caller's active vote renders filled; tapping it again removes
  the vote; tapping the other side switches it. Optimistic UI, reconciled on
  the server response.
- Community-added dishes show "added by @handle" attribution.

### Add-a-dish flow (signed-in) — one modal, two steps

1. **Where?** Searchable restaurant picker (seeded + community venues, with
   neighborhood shown). "+ New restaurant" expands inline fields: name
   (required), street address (required), neighborhood, website (optional).
2. **What?** Dish name (required), one-line description, tag chips (existing
   vocabulary + free text). While typing, a client-side check against the
   already-loaded catalog warns "Already listed at this restaurant — vote it
   up instead ↓" with a jump link.

Submit → dish is live immediately, toast confirms, list scrolls to the new
highlighted card.

### Signed-out experience

Vote and Add controls are visible but gated: tapping opens a small prompt —
"Sign in to vote — it takes a minute" → `/login?next=/reverse-lookup`. Actions
are signposted, never hidden.

Note: `/login` does not currently honor a `next` query param — adding that
redirect (validated as a same-origin path) is part of this work.

## Data model

Migrations live in the sibling `backend_migrations` repo (canonical clone, not
the stale nested submodule). Postgres DOMAINs, not enums:

```sql
CREATE DOMAIN rl_dish_status AS TEXT CHECK (VALUE IN ('live','hidden'));
CREATE DOMAIN vote_value     AS SMALLINT CHECK (VALUE IN (-1, 1));
```

### `restaurants`

| column | type | notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| city | text NOT NULL | default `'seattle'` |
| name | text NOT NULL | unique `(city, lower(name))` |
| website / instagram / facebook | text NULL | |
| description | text NULL | |
| cuisines | text[] NOT NULL default '{}' | split of CSV pipe-separated `types` |
| verified | boolean NOT NULL default false | CSV seeds true; user-created false |
| last_verified | date NULL | from CSV |
| created_by | uuid NULL → auth.users | null for seeds |
| created_at | timestamptz NOT NULL default now() | |

### `restaurant_locations`

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| restaurant_id | uuid FK → restaurants ON DELETE CASCADE | |
| address | text NOT NULL | |
| neighborhood | text NULL | |
| phone | text NULL | |

CSV positional columns `address_1..4` / `neighborhood_1..4` / `phone_1..4`
normalize to one row per location.

### `restaurant_dishes`

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| restaurant_id | uuid FK → restaurants ON DELETE CASCADE | |
| name | text NOT NULL | unique `(restaurant_id, lower(name))` |
| description | text NULL | |
| tags | jsonb NOT NULL default '[]' | |
| details | jsonb NOT NULL default '{}' | ingredients / allergens / flavors from seattle.json ride along without schema churn |
| status | rl_dish_status NOT NULL default 'live' | admin killswitch |
| created_by | uuid NULL → auth.users | |
| created_at | timestamptz NOT NULL default now() | |

### `restaurant_dish_votes`

| column | type | notes |
|---|---|---|
| dish_id | uuid FK → restaurant_dishes ON DELETE CASCADE | PK part |
| user_id | uuid FK → auth.users ON DELETE CASCADE | PK part |
| value | vote_value NOT NULL | +1 / −1 |
| created_at / updated_at | timestamptz | |

PK `(dish_id, user_id)` = one vote per user per dish. Re-vote is an upsert;
un-vote is a delete — idempotent by construction.

### Read path

The whole city catalog ships in one query per visit (dishes ⋈ restaurants ⋈
locations + votes aggregate); all search/filter is client-side, like today's
static JSON. Pagination is deferred until a city outgrows this.

### Existing table

`reverse_lookup_suggestions` is left untouched (it may hold pending rows), but
the anonymous suggest modal and mailto links retire with the static page.

## API surface

All routes: `export const dynamic = "force-dynamic"` and
`export const maxDuration = 60` (Nhost cold-start protection). Auth uses the
existing fail-closed `verifyNhostJwt` Bearer pattern from `lib/jwt.ts` (as in
`qr/claim`). GraphQL calls use the admin secret server-side with the verified
`user_id` from the token.

| Route | Auth | Behavior |
|---|---|---|
| `GET /api/reverse-lookup/catalog?city=` | optional Bearer | Catalog (live dishes only) + vote totals; adds `myVote` per dish for valid tokens |
| `POST /api/reverse-lookup/dishes` | Bearer required | Add dish. Body: `{restaurantId}` **or** `{newRestaurant:{name,address,neighborhood?,website?}}`, plus `{name, description?, tags?}`. Duplicate dish or restaurant → `200 {ok, existed:true}` with the existing row |
| `PUT /api/reverse-lookup/dishes/[id]/vote` | Bearer required | `{value: 1 \| -1 \| null}` — upsert vote or delete on null; returns new totals |
| `PATCH /api/reverse-lookup/dishes/[id]` | admin secret (`adminGuard`) | `{status:'hidden'\|'live'}` moderation killswitch |

Every mutation is idempotent so a retry after a dropped response (the cold-start
failure mode fixed on 2026-07-05) can never dead-end the user.

## Error handling

- Vote/add with an invalid or expired token → 401 with a friendly client
  prompt to sign in again.
- Catalog fetch failure → error card with retry button (port of the current
  `rl-error` state).
- Optimistic vote reconciliation: on failure the client reverts the count and
  shows a toast.
- Server validation mirrors client rules (name lengths, tag count cap, URL
  shape for websites) — client checks are UX, server checks are the contract.

## Seeding

`scripts/seed-reverse-lookup.ts`, run manually with admin credentials:

1. Parse the SVG Guide CSV (26 Seattle-area restaurants) → `restaurants`
   (`verified=true`, `last_verified` from CSV) + `restaurant_locations`.
   The CSV is vendored into the repo (`scripts/data/svg-guide-2026-06-29.csv`)
   rather than fetched from GitHub at seed time, so seeds are reproducible
   and the user can append restaurants to the file before the seed run.
2. Port `public/reverse-lookup/data/seattle.json` dishes → `restaurant_dishes`,
   creating venues not present in the CSV (e.g. Three Cats Cafe) as verified
   entries with their known addresses.
3. Idempotent upserts keyed on the unique indexes — safe to re-run.

**Hard gate:** the seed does NOT run until the user explicitly approves — they
plan to add more restaurants to the list first. (Also: localhost dev is wired
to the production database; no test writes.)

## Testing

- `bun test` units for pure logic extracted to `lib/reverse-lookup.ts`:
  CSV row → restaurant/location normalization, seattle.json → dish mapping,
  vote-total math, request validation.
- Manual end-to-end pass after deploy: search both tabs, vote toggle/switch/
  remove, add dish (existing + new restaurant), duplicate warning, signed-out
  gates, admin hide.
- No automated tests write to the (production) database.

## Out of scope (YAGNI)

- Multi-city UI (schema is city-ready; UI stays Seattle-only).
- Dish photos, comments, or star ratings (thumbs only).
- Restaurant claiming/ownership, hours, menus.
- Migrating `reverse_lookup_suggestions` pending rows (manual triage later).
