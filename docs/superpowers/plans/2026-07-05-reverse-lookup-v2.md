# Reverse Lookup v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static reverse-lookup page with a DB-backed, community-driven catalog at `/reverse-lookup`: three tabs (Dishes / Restaurants / Leaderboards), locals-vs-visitors Yum Meter scores from thumbs votes, sign-in-gated adding/voting, inline restaurant creation.

**Architecture:** Four new Postgres tables behind Nhost/Hasura (migrations in the sibling `backend_migrations` repo), thin idempotent Next API routes using the admin secret + `verifyNhostJwt` Bearer auth, all score/ranking math in a pure `lib/reverse-lookup.ts` (bun-tested), and a client-rendered app-router page styled on the vendored "Yum Lookup" sample.

**Tech Stack:** Next.js app router, Nhost (Hasura GraphQL, HS256 JWT), Tailwind, bun test.

**Spec:** `docs/superpowers/specs/2026-07-05-reverse-lookup-v2-design.md`
**Style sample:** `docs/superpowers/specs/assets/yum-lookup-sample/app.jsx` (port `CuteFace`, mood tiers, leaderboard row layout)

**⚠️ Critical constraints (from project memory):**
- Migrations go in `/home/shnushnu/Projects/animalprojectbuddies/backend_migrations` (sibling clone), NOT the stale nested submodule.
- localhost:3000 talks to the **production** Nhost DB. Do NOT create test rows from the browser; manual verification is read-only until launch. All logic verification happens via `bun test`.
- The seed script is WRITTEN but NOT RUN — the user will extend the restaurant list first and gives an explicit go.
- Every API route: `export const dynamic = "force-dynamic"` + `export const maxDuration = 60` + idempotent mutations (see the 2026-07-05 cold-start fixes).

---

## File structure

```
backend_migrations/nhost/
  migrations/default/1783200000000_add_reverse_lookup_catalog/{up,down}.sql   (Task 1)
  metadata/databases/default/tables/public_restaurants.yaml                    (Task 1)
  metadata/databases/default/tables/public_restaurant_locations.yaml           (Task 1)
  metadata/databases/default/tables/public_restaurant_dishes.yaml              (Task 1)
  metadata/databases/default/tables/public_restaurant_dish_votes.yaml          (Task 1)
  metadata/databases/default/tables/tables.yaml                                (Task 1, modify)

aheadofthemenu/
  scripts/data/svg-guide-2026-06-29.csv          (Task 2 — vendored seed data)
  scripts/data/seattle-dishes.json               (Task 2 — moved from public/)
  lib/reverse-lookup.ts                          (Task 3 — constants, score math, CSV parse, validation)
  lib/reverse-lookup.test.ts                     (Task 3)
  app/api/reverse-lookup/catalog/route.ts        (Task 4 — GET catalog)
  app/api/reverse-lookup/dishes/route.ts         (Task 5 — POST add dish)
  app/api/reverse-lookup/dishes/[id]/vote/route.ts (Task 6 — PUT vote)
  app/api/reverse-lookup/dishes/[id]/route.ts    (Task 7 — admin PATCH)
  components/auth/LoginForm.tsx                  (Task 8 — modify: ?next= redirect)
  app/reverse-lookup/components/CuteFace.tsx     (Task 9)
  app/reverse-lookup/components/YumMeter.tsx     (Task 9)
  app/reverse-lookup/components/VoteWidget.tsx   (Task 10)
  app/reverse-lookup/components/DishCard.tsx     (Task 10)
  app/reverse-lookup/components/RestaurantCard.tsx (Task 11)
  app/reverse-lookup/components/LeaderboardView.tsx (Task 11)
  app/reverse-lookup/components/AddDishModal.tsx (Task 12)
  app/reverse-lookup/page.tsx                    (Task 13 — shell: tabs, search, fetch)
  scripts/seed-reverse-lookup.ts                 (Task 14 — written, NOT run)
  middleware.ts                                  (Task 15 — modify: drop "reverse-lookup" from STATIC_APPS)
  public/reverse-lookup/                         (Task 15 — DELETE)
  app/api/reverse-lookup/suggest/route.ts        (Task 15 — DELETE; table stays)
```

Existing pieces to reuse (do not reinvent):
- `lib/nhost.ts` → `graphql()` helper (admin-secret GraphQL from API routes)
- `lib/jwt.ts` → `verifyNhostJwt(token)` → `{ userId, roles } | null`
- `lib/admin.ts` → `adminGuard(req)`
- `components/AuthProvider.tsx` → `useAuth()` → `{ userId, session, isAuthenticated }`; token = `session?.accessToken`
- `components/ui/modal.tsx`, `components/ui/input.tsx`, `components/ui/button.tsx`
- Bearer-auth client pattern: `app/submit-dish/RecipeIntakeForm.tsx:162-171`
- Idempotent duplicate handling pattern: `app/api/creators/route.ts` POST (2026-07-05 version)

---

### Task 1: Database migration + Hasura metadata (backend_migrations repo)

**Files:**
- Create: `../backend_migrations/nhost/migrations/default/1783200000000_add_reverse_lookup_catalog/up.sql`
- Create: `../backend_migrations/nhost/migrations/default/1783200000000_add_reverse_lookup_catalog/down.sql`
- Create: `../backend_migrations/nhost/metadata/databases/default/tables/public_restaurants.yaml` (+ 3 more)
- Modify: `../backend_migrations/nhost/metadata/databases/default/tables/tables.yaml`

- [ ] **Step 1: Write up.sql**

```sql
-- Reverse-lookup catalog: restaurants + locations seeded from the SVG guide
-- CSV, community-added dishes, and thumbs votes split by voter cohort
-- (locals vs visitors). See aheadofthemenu docs/superpowers/specs/
-- 2026-07-05-reverse-lookup-v2-design.md.

CREATE DOMAIN rl_dish_status AS TEXT CHECK (VALUE IN ('live', 'hidden'));
CREATE DOMAIN vote_value     AS SMALLINT CHECK (VALUE IN (-1, 1));
CREATE DOMAIN voter_kind     AS TEXT CHECK (VALUE IN ('local', 'visitor'));

CREATE TABLE public.restaurants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city          TEXT NOT NULL DEFAULT 'seattle',
  name          TEXT NOT NULL,
  website       TEXT,
  instagram     TEXT,
  facebook      TEXT,
  description   TEXT,
  cuisines      TEXT[] NOT NULL DEFAULT '{}',
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  last_verified DATE,
  created_by    UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness per city (no duplicate "Plum Bistro").
CREATE UNIQUE INDEX restaurants_city_name_lower_idx
  ON public.restaurants (city, lower(name));

CREATE TABLE public.restaurant_locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants (id) ON DELETE CASCADE,
  address       TEXT NOT NULL,
  neighborhood  TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX restaurant_locations_restaurant_idx
  ON public.restaurant_locations (restaurant_id);

CREATE TABLE public.restaurant_dishes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  tags          JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Free-form extras (ingredients, allergens, flavors) ported from the old
  -- static seattle.json — searchable client-side without schema churn.
  details       JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        rl_dish_status NOT NULL DEFAULT 'live',
  created_by    UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX restaurant_dishes_restaurant_name_lower_idx
  ON public.restaurant_dishes (restaurant_id, lower(name));

-- The read path is "all live dishes for a city" via the restaurant join.
CREATE INDEX restaurant_dishes_restaurant_status_idx
  ON public.restaurant_dishes (restaurant_id, status);

CREATE TABLE public.restaurant_dish_votes (
  dish_id    UUID NOT NULL REFERENCES public.restaurant_dishes (id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  value      vote_value NOT NULL,
  -- Snapshot of the per-vote "Are you a local?" toggle (defaulted to local).
  voter_kind voter_kind NOT NULL DEFAULT 'local',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (dish_id, user_id)
);
```

- [ ] **Step 2: Write down.sql**

```sql
DROP TABLE public.restaurant_dish_votes;
DROP TABLE public.restaurant_dishes;
DROP TABLE public.restaurant_locations;
DROP TABLE public.restaurants;
DROP DOMAIN voter_kind;
DROP DOMAIN vote_value;
DROP DOMAIN rl_dish_status;
```

- [ ] **Step 3: Write the four metadata table YAMLs**

`public_restaurants.yaml`:
```yaml
table:
  name: restaurants
  schema: public
array_relationships:
  - name: locations
    using:
      foreign_key_constraint_on:
        column: restaurant_id
        table:
          name: restaurant_locations
          schema: public
  - name: dishes
    using:
      foreign_key_constraint_on:
        column: restaurant_id
        table:
          name: restaurant_dishes
          schema: public
```

`public_restaurant_locations.yaml`:
```yaml
table:
  name: restaurant_locations
  schema: public
object_relationships:
  - name: restaurant
    using:
      foreign_key_constraint_on: restaurant_id
```

`public_restaurant_dishes.yaml`:
```yaml
table:
  name: restaurant_dishes
  schema: public
object_relationships:
  - name: restaurant
    using:
      foreign_key_constraint_on: restaurant_id
  - name: created_by_user
    using:
      foreign_key_constraint_on: created_by
array_relationships:
  - name: votes
    using:
      foreign_key_constraint_on:
        column: dish_id
        table:
          name: restaurant_dish_votes
          schema: public
```

`public_restaurant_dish_votes.yaml`:
```yaml
table:
  name: restaurant_dish_votes
  schema: public
object_relationships:
  - name: dish
    using:
      foreign_key_constraint_on: dish_id
```

- [ ] **Step 4: Register the YAMLs in tables.yaml**

Add (alphabetical placement near the other `public_*` includes):
```yaml
- "!include public_restaurant_dish_votes.yaml"
- "!include public_restaurant_dishes.yaml"
- "!include public_restaurant_locations.yaml"
- "!include public_restaurants.yaml"
```

No Hasura permissions blocks: all access goes through Next API routes with the admin secret (same as every other table here).

- [ ] **Step 5: Commit in backend_migrations**

```bash
cd /home/shnushnu/Projects/animalprojectbuddies/backend_migrations
git add nhost/migrations/default/1783200000000_add_reverse_lookup_catalog nhost/metadata
git commit -m "feat: reverse-lookup catalog tables (restaurants, locations, dishes, cohort votes)"
```

**Note:** Do NOT apply/deploy the migration yourself. Applying it is part of the user-gated launch step (Task 16) — flag it there.

---

### Task 2: Vendor the seed data into the app repo

**Files:**
- Create: `scripts/data/svg-guide-2026-06-29.csv`
- Create: `scripts/data/seattle-dishes.json`

- [ ] **Step 1: Vendor the CSV**

```bash
mkdir -p scripts/data
curl -sL "https://raw.githubusercontent.com/jzesbaugh/svg-public/main/SVG_Guide_Data.csv" -o scripts/data/svg-guide-2026-06-29.csv
wc -l scripts/data/svg-guide-2026-06-29.csv   # expect 27 (header + 26 rows)
```

- [ ] **Step 2: Copy the legacy dish catalog** (the static page is deleted in Task 15; this copy is the seed's source)

```bash
cp public/reverse-lookup/data/seattle.json scripts/data/seattle-dishes.json
```

- [ ] **Step 3: Commit**

```bash
git add scripts/data
git commit -m "chore: vendor reverse-lookup seed data (SVG guide CSV + legacy seattle.json)"
```

---

### Task 3: Pure logic library — `lib/reverse-lookup.ts` (TDD)

**Files:**
- Create: `lib/reverse-lookup.ts`
- Test: `lib/reverse-lookup.test.ts`

All score math, tiers, leaderboard ranking, CSV parsing, and request validation live here so they're testable without the network. Work in TDD slices: for each slice write the failing tests, run `bun test lib/reverse-lookup.test.ts` (expect FAIL), implement, run again (expect PASS).

- [ ] **Step 1: Slice 1 tests — score math + meter states**

```ts
import { describe, test, expect } from "bun:test";
import {
  MIN_VOTES_TO_SCORE, scorePct, meterState, tierFor,
  aggregateVotes, rankLeaderboard, leaderboardCategories, sortDishCards,
  parseSvgCsv, validateAddDish, validateVote,
} from "./reverse-lookup";

describe("scorePct", () => {
  test("rounds up/(up+down) to a whole percent", () => {
    expect(scorePct({ up: 2, down: 1 })).toBe(67);
    expect(scorePct({ up: 0, down: 5 })).toBe(0);
    expect(scorePct({ up: 5, down: 0 })).toBe(100);
  });
});

describe("meterState", () => {
  test("empty below 1 vote", () => {
    expect(meterState({ up: 0, down: 0 })).toEqual({ state: "empty" });
  });
  test("tallying below MIN_VOTES_TO_SCORE — no pct exposed", () => {
    const s = meterState({ up: 3, down: 1 });
    expect(s).toEqual({ state: "tallying", votes: 4 });
  });
  test("scored at the threshold", () => {
    const s = meterState({ up: 4, down: 1 });
    expect(s.state).toBe("scored");
    if (s.state === "scored") {
      expect(s.pct).toBe(80);
      expect(s.votes).toBe(5);
      expect(s.tier.label).toBe("Yum");
    }
  });
});

describe("tierFor", () => {
  test("tier boundaries match the sample", () => {
    expect(tierFor(90).label).toBe("Top Bite");
    expect(tierFor(89).label).toBe("Yum");
    expect(tierFor(79).label).toBe("Tasty");
    expect(tierFor(69).label).toBe("Meh");
    expect(tierFor(54).label).toBe("Skip");
  });
});

describe("aggregateVotes", () => {
  test("splits rows into local/visitor cohorts", () => {
    const rows = [
      { value: 1, voter_kind: "local" },
      { value: 1, voter_kind: "local" },
      { value: -1, voter_kind: "visitor" },
    ];
    expect(aggregateVotes(rows)).toEqual({
      locals: { up: 2, down: 0 },
      visitors: { up: 0, down: 1 },
      total: 3,
    });
  });
});
```

- [ ] **Step 2: Run tests, verify they fail** — `bun test lib/reverse-lookup.test.ts` → FAIL (module not found)

- [ ] **Step 3: Implement slice 1**

```ts
/**
 * lib/reverse-lookup.ts
 *
 * Pure logic for the reverse-lookup catalog: Yum-Meter score math, mood
 * tiers, leaderboard ranking, seed-CSV parsing, and API request validation.
 * No network, no framework imports — everything here is bun-testable.
 */

/** One knob for score confidence: below this many votes a cohort shows
 * "Still tallying…" with NO percentage (early numbers would anchor voters). */
export const MIN_VOTES_TO_SCORE = 5;

export type VoterKind = "local" | "visitor";
export type VoteTotals = { up: number; down: number };

export type Tier = {
  key: "love" | "yum" | "tasty" | "meh" | "skip";
  label: string;
  color: string;
  soft: string;
  face: "love" | "happy" | "smile" | "neutral" | "sad";
};

// Boundaries and palette from the user's Yum Lookup sample (moodFor).
export function tierFor(pct: number): Tier {
  if (pct >= 90) return { key: "love",  label: "Top Bite", color: "#3F8F5A", soft: "#E8F2EA", face: "love" };
  if (pct >= 80) return { key: "yum",   label: "Yum",      color: "#6BA84A", soft: "#EEF3E0", face: "happy" };
  if (pct >= 70) return { key: "tasty", label: "Tasty",    color: "#CFA017", soft: "#FAF1D2", face: "smile" };
  if (pct >= 55) return { key: "meh",   label: "Meh",      color: "#D17B3A", soft: "#FCE9D9", face: "neutral" };
  return { key: "skip", label: "Skip", color: "#C95B4F", soft: "#FBDDD7", face: "sad" };
}

export function scorePct(t: VoteTotals): number {
  const total = t.up + t.down;
  return total === 0 ? 0 : Math.round((100 * t.up) / total);
}

export type MeterState =
  | { state: "scored"; pct: number; votes: number; tier: Tier }
  | { state: "tallying"; votes: number }
  | { state: "empty" };

export function meterState(t: VoteTotals): MeterState {
  const votes = t.up + t.down;
  if (votes === 0) return { state: "empty" };
  if (votes < MIN_VOTES_TO_SCORE) return { state: "tallying", votes };
  const pct = scorePct(t);
  return { state: "scored", pct, votes, tier: tierFor(pct) };
}

export type VoteRow = { value: number; voter_kind: string };
export type CohortTotals = { locals: VoteTotals; visitors: VoteTotals; total: number };

export function aggregateVotes(rows: VoteRow[]): CohortTotals {
  const locals = { up: 0, down: 0 };
  const visitors = { up: 0, down: 0 };
  for (const r of rows) {
    const bucket = r.voter_kind === "visitor" ? visitors : locals;
    if (r.value > 0) bucket.up += 1;
    else bucket.down += 1;
  }
  return { locals, visitors, total: rows.length };
}
```

- [ ] **Step 4: Run slice 1 tests** — expect PASS. Commit: `git commit -m "feat(reverse-lookup): score math, mood tiers, cohort aggregation"`

- [ ] **Step 5: Slice 2 tests — leaderboard ranking + dish sort**

```ts
const dish = (over: object) => ({
  id: "d1", name: "Pie", tags: ["pizza"],
  locals: { up: 0, down: 0 }, visitors: { up: 0, down: 0 },
  createdAt: "2026-07-01T00:00:00Z",
  ...over,
});

describe("rankLeaderboard", () => {
  test("requires MIN_VOTES_TO_SCORE total votes to rank", () => {
    const d1 = dish({ id: "a", locals: { up: 4, down: 0 } });            // 4 votes — out
    const d2 = dish({ id: "b", locals: { up: 3, down: 2 } });            // 5 votes — in
    expect(rankLeaderboard([d1, d2], "pizza").map((d) => d.id)).toEqual(["b"]);
  });
  test("ranks by overall pct across ALL votes, desc", () => {
    const low  = dish({ id: "low",  locals: { up: 3, down: 2 } });               // 60%
    const high = dish({ id: "high", locals: { up: 4, down: 0 }, visitors: { up: 1, down: 0 } }); // 100%
    expect(rankLeaderboard([low, high], "pizza").map((d) => d.id)).toEqual(["high", "low"]);
  });
  test("filters by tag", () => {
    const pizza = dish({ id: "p", locals: { up: 5, down: 0 } });
    const burger = dish({ id: "b", tags: ["burger"], locals: { up: 5, down: 0 } });
    expect(rankLeaderboard([pizza, burger], "burger").map((d) => d.id)).toEqual(["b"]);
  });
});

describe("leaderboardCategories", () => {
  test("a tag qualifies with ≥ 2 rankable dishes", () => {
    const a = dish({ id: "a", locals: { up: 5, down: 0 } });
    const b = dish({ id: "b", locals: { up: 5, down: 0 } });
    const c = dish({ id: "c", tags: ["burger"], locals: { up: 5, down: 0 } });
    expect(leaderboardCategories([a, b, c])).toEqual(["pizza"]);
  });
});

describe("sortDishCards", () => {
  test("scored dishes first by pct desc, then tallying by votes desc then newest", () => {
    const scored = dish({ id: "s", locals: { up: 5, down: 0 } });
    const tallyBig = dish({ id: "tb", locals: { up: 3, down: 0 } });
    const tallyNew = dish({ id: "tn", locals: { up: 1, down: 0 }, createdAt: "2026-07-04T00:00:00Z" });
    const tallyOld = dish({ id: "to", locals: { up: 1, down: 0 }, createdAt: "2026-07-01T00:00:00Z" });
    expect(sortDishCards([tallyOld, tallyNew, tallyBig, scored]).map((d) => d.id))
      .toEqual(["s", "tb", "tn", "to"]);
  });
});
```

- [ ] **Step 6: Run → FAIL. Implement slice 2**

```ts
export type ScorableDish = {
  id: string;
  name: string;
  tags: string[];
  locals: VoteTotals;
  visitors: VoteTotals;
  createdAt: string;
};

const totalVotes = (d: ScorableDish) =>
  d.locals.up + d.locals.down + d.visitors.up + d.visitors.down;

export const overallTotals = (d: ScorableDish): VoteTotals => ({
  up: d.locals.up + d.visitors.up,
  down: d.locals.down + d.visitors.down,
});

/** Dishes with ≥ MIN_VOTES_TO_SCORE total votes, tag-filtered, by overall % desc. */
export function rankLeaderboard<T extends ScorableDish>(dishes: T[], tag: string): T[] {
  return dishes
    .filter((d) => d.tags.includes(tag) && totalVotes(d) >= MIN_VOTES_TO_SCORE)
    .sort((a, b) => scorePct(overallTotals(b)) - scorePct(overallTotals(a)) || totalVotes(b) - totalVotes(a));
}

/** Tags with at least 2 rankable dishes, alphabetical. */
export function leaderboardCategories(dishes: ScorableDish[]): string[] {
  const counts = new Map<string, number>();
  for (const d of dishes) {
    if (totalVotes(d) < MIN_VOTES_TO_SCORE) continue;
    for (const t of d.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries()).filter(([, n]) => n >= 2).map(([t]) => t).sort();
}

/** Dishes tab order: scored (pct desc), then still-tallying (votes desc, newest first). */
export function sortDishCards<T extends ScorableDish>(dishes: T[]): T[] {
  return [...dishes].sort((a, b) => {
    const aScored = totalVotes(a) >= MIN_VOTES_TO_SCORE;
    const bScored = totalVotes(b) >= MIN_VOTES_TO_SCORE;
    if (aScored !== bScored) return aScored ? -1 : 1;
    if (aScored) return scorePct(overallTotals(b)) - scorePct(overallTotals(a));
    return totalVotes(b) - totalVotes(a) || b.createdAt.localeCompare(a.createdAt);
  });
}
```

- [ ] **Step 7: Run → PASS. Commit:** `git commit -m "feat(reverse-lookup): leaderboard ranking + dish card sort"`

- [ ] **Step 8: Slice 3 tests — CSV parsing**

```ts
describe("parseSvgCsv", () => {
  const csv = [
    "name,website,types,address_1,address_2,address_3,address_4,neighborhood_1,neighborhood_2,neighborhood_3,neighborhood_4,phone_1,phone_2,phone_3,phone_4,instagram,facebook,description,last_verified",
    `Araya's Place,https://www.arayasplace.com,Thai,"5240 University Way NE, Seattle, WA 98105","10246 Main St, Bellevue, WA",,,U-District,Eastside,,,(206) 524-4332,(425) 454-2440,,,https://instagram.com/a,https://facebook.com/b,"Classic Thai — curries, and ""more"".",2026-06-29`,
    "Box Bar,https://boxbarseattle.com,American | Bar,\"5401 California Ave SW, Seattle, WA\",,,,West Seattle,,,,(206) 432-9554,,,,,,Casual spot.,2026-06-29",
  ].join("\n");

  test("parses quoted fields, positional locations, pipe-split cuisines", () => {
    const rows = parseSvgCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Araya's Place");
    expect(rows[0].cuisines).toEqual(["Thai"]);
    expect(rows[0].description).toContain('and "more"');
    expect(rows[0].locations).toEqual([
      { address: "5240 University Way NE, Seattle, WA 98105", neighborhood: "U-District", phone: "(206) 524-4332" },
      { address: "10246 Main St, Bellevue, WA", neighborhood: "Eastside", phone: "(425) 454-2440" },
    ]);
    expect(rows[1].cuisines).toEqual(["American", "Bar"]);
    expect(rows[1].locations[0].phone).toBe("(206) 432-9554");
    expect(rows[0].lastVerified).toBe("2026-06-29");
  });
});
```

- [ ] **Step 9: Run → FAIL. Implement slice 3**

```ts
export type SeedLocation = { address: string; neighborhood: string | null; phone: string | null };
export type SeedRestaurant = {
  name: string;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  description: string | null;
  cuisines: string[];
  lastVerified: string | null;
  locations: SeedLocation[];
};

/** Minimal RFC-4180 CSV parser (quoted fields, "" escapes, LF/CRLF rows). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

export function parseSvgCsv(text: string): SeedRestaurant[] {
  const [header, ...rows] = parseCsv(text);
  const col = (name: string) => header.indexOf(name);
  const get = (r: string[], name: string) => (r[col(name)] ?? "").trim();
  return rows.map((r) => {
    const locations: SeedLocation[] = [];
    for (const n of [1, 2, 3, 4]) {
      const address = get(r, `address_${n}`);
      if (!address) continue;
      locations.push({
        address,
        neighborhood: get(r, `neighborhood_${n}`) || null,
        phone: get(r, `phone_${n}`) || null,
      });
    }
    return {
      name: get(r, "name"),
      website: get(r, "website") || null,
      instagram: get(r, "instagram") || null,
      facebook: get(r, "facebook") || null,
      description: get(r, "description") || null,
      cuisines: get(r, "types").split("|").map((s) => s.trim()).filter(Boolean),
      lastVerified: get(r, "last_verified") || null,
      locations,
    };
  }).filter((r) => r.name);
}
```

- [ ] **Step 10: Run → PASS. Commit:** `git commit -m "feat(reverse-lookup): SVG guide CSV parser"`

- [ ] **Step 11: Slice 4 tests — request validation**

```ts
describe("validateAddDish", () => {
  test("accepts an existing-restaurant body", () => {
    const v = validateAddDish({ restaurantId: "3e9a2f6c-0000-0000-0000-000000000000", name: "Katsu Curry", tags: ["curry"] });
    expect("error" in v).toBe(false);
  });
  test("accepts an inline new restaurant", () => {
    const v = validateAddDish({ newRestaurant: { name: "New Spot", address: "1 Main St" }, name: "Pie" });
    expect("error" in v).toBe(false);
  });
  test("rejects missing dish name / missing venue / oversized fields / non-UUID id", () => {
    const uuid = "3e9a2f6c-0000-0000-0000-000000000000";
    expect(validateAddDish({ restaurantId: uuid, name: "" })).toHaveProperty("error");
    expect(validateAddDish({ name: "Pie" })).toHaveProperty("error");
    expect(validateAddDish({ newRestaurant: { name: "A", address: "" }, name: "Pie" })).toHaveProperty("error");
    expect(validateAddDish({ restaurantId: uuid, name: "a".repeat(121) })).toHaveProperty("error");
    expect(validateAddDish({ restaurantId: "not-a-uuid", name: "Pie" })).toHaveProperty("error");
  });
  test("caps tags at 12 and drops non-strings", () => {
    const uuid = "3e9a2f6c-0000-0000-0000-000000000000";
    const v = validateAddDish({ restaurantId: uuid, name: "Pie", tags: [...Array(20).keys()].map(String).concat([3 as any]) });
    expect("error" in v).toBe(false);
    if ("error" in v) throw new Error("unreachable");
    expect(v.tags).toHaveLength(12);
  });
});

describe("validateVote", () => {
  test("accepts 1, -1, null; isLocal defaults true", () => {
    expect(validateVote({ value: 1 })).toEqual({ value: 1, voterKind: "local" });
    expect(validateVote({ value: -1, isLocal: false })).toEqual({ value: -1, voterKind: "visitor" });
    expect(validateVote({ value: null })).toEqual({ value: null, voterKind: "local" });
  });
  test("rejects other values", () => {
    expect(validateVote({ value: 2 })).toHaveProperty("error");
    expect(validateVote({})).toHaveProperty("error");
  });
});
```

- [ ] **Step 12: Run → FAIL. Implement slice 4**

```ts
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export type AddDishInput = {
  restaurantId: string | null;
  newRestaurant: { name: string; address: string; neighborhood: string | null; website: string | null } | null;
  name: string;
  description: string | null;
  tags: string[];
};

export function validateAddDish(body: any): AddDishInput | { error: string } {
  const name = str(body?.name, 120);
  if (!name) return { error: "Dish name is required" };
  if (String(body?.name ?? "").trim().length > 120) return { error: "Dish name is too long" };

  const tags = Array.isArray(body?.tags)
    ? body.tags.filter((t: unknown) => typeof t === "string").map((t: string) => str(t, 40)).filter(Boolean).slice(0, 12)
    : [];

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const restaurantId = body?.restaurantId ? String(body.restaurantId) : null;
  if (restaurantId && !UUID_RE.test(restaurantId)) return { error: "Invalid restaurant id" };
  let newRestaurant: AddDishInput["newRestaurant"] = null;
  if (!restaurantId) {
    const rn = str(body?.newRestaurant?.name, 120);
    const addr = str(body?.newRestaurant?.address, 300);
    if (!rn || !addr) return { error: "Pick a restaurant or give a new one a name and address" };
    let website = str(body?.newRestaurant?.website, 300) || null;
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    newRestaurant = { name: rn, address: addr, neighborhood: str(body?.newRestaurant?.neighborhood, 80) || null, website };
  }

  return { restaurantId, newRestaurant, name, description: str(body?.description, 500) || null, tags };
}

export type VoteInput = { value: 1 | -1 | null; voterKind: VoterKind };

export function validateVote(body: any): VoteInput | { error: string } {
  const value = body?.value;
  if (value !== 1 && value !== -1 && value !== null) return { error: "value must be 1, -1, or null" };
  return { value, voterKind: body?.isLocal === false ? "visitor" : "local" };
}
```

Note the dish-name length rule: `str()` silently truncates, so check the raw length for the "too long" rejection before truncating (the test at Step 11 relies on it).

- [ ] **Step 13: Run full suite** — `bun test` → all pass (existing 39 + new). Commit: `git commit -m "feat(reverse-lookup): add-dish and vote request validation"`

---

### Task 4: API — GET catalog

**Files:**
- Create: `app/api/reverse-lookup/catalog/route.ts`

- [ ] **Step 1: Implement the route** (no unit test — it's GraphQL plumbing; logic already tested in lib)

```ts
/**
 * GET /api/reverse-lookup/catalog?city=seattle
 * The whole city catalog in one query: restaurants (+locations) and live
 * dishes with per-cohort vote totals. With a valid Bearer token, each dish
 * also carries the caller's own vote (myVote).
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { verifyNhostJwt } from "@/lib/jwt";
import { aggregateVotes } from "@/lib/reverse-lookup";

export const dynamic = "force-dynamic";
// Nhost cold starts can outlast the default function timeout; give it room.
export const maxDuration = 60;

type Row = {
  id: string; name: string; website: string | null; instagram: string | null;
  facebook: string | null; description: string | null; cuisines: string[];
  verified: boolean;
  locations: Array<{ id: string; address: string; neighborhood: string | null; phone: string | null }>;
  dishes: Array<{
    id: string; name: string; description: string | null; tags: unknown;
    details: unknown; created_at: string;
    created_by_user: { displayName: string | null; metadata: any } | null;
    votes: Array<{ user_id: string; value: number; voter_kind: string }>;
  }>;
};

export async function GET(request: NextRequest) {
  const city = (request.nextUrl.searchParams.get("city") ?? "seattle").toLowerCase();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const caller = verifyNhostJwt(token);

  try {
    const res = await graphql<{ restaurants: Row[] }>(
      `query ($city: String!) {
         restaurants(where: { city: { _eq: $city } }, order_by: { name: asc }) {
           id name website instagram facebook description cuisines verified
           locations(order_by: { created_at: asc }) { id address neighborhood phone }
           dishes(where: { status: { _eq: "live" } }) {
             id name description tags details created_at
             created_by_user { displayName metadata }
             votes { user_id value voter_kind }
           }
         }
       }`,
      { useAdminSecret: true, variables: { city } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);

    const restaurants = (res.data?.restaurants ?? []).map((r) => ({
      id: r.id, name: r.name, website: r.website, instagram: r.instagram,
      facebook: r.facebook, description: r.description, cuisines: r.cuisines,
      verified: r.verified, locations: r.locations, dishCount: r.dishes.length,
    }));

    const dishes = (res.data?.restaurants ?? []).flatMap((r) =>
      r.dishes.map((d) => {
        const { locals, visitors } = aggregateVotes(d.votes);
        const mine = caller ? d.votes.find((v) => v.user_id === caller.userId) : undefined;
        return {
          id: d.id,
          restaurantId: r.id,
          restaurantName: r.name,
          verified: r.verified,
          website: r.website,
          location: r.locations[0] ?? null,
          name: d.name,
          description: d.description,
          tags: Array.isArray(d.tags) ? d.tags : [],
          details: d.details ?? {},
          createdAt: d.created_at,
          addedBy: d.created_by_user?.metadata?.handle ?? d.created_by_user?.displayName ?? null,
          locals, visitors,
          myVote: mine ? { value: mine.value, isLocal: mine.voter_kind !== "visitor" } : null,
        };
      })
    );

    return NextResponse.json({ city, restaurants, dishes });
  } catch {
    return NextResponse.json({ error: "Couldn't load the catalog right now" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Verify it compiles** — `bun run build 2>&1 | tail -5` → build succeeds.
- [ ] **Step 3: Commit** — `git commit -m "feat(reverse-lookup): catalog API with cohort vote totals"`

---

### Task 5: API — POST add dish (idempotent, inline restaurant)

**Files:**
- Create: `app/api/reverse-lookup/dishes/route.ts`

- [ ] **Step 1: Implement**

```ts
/**
 * POST /api/reverse-lookup/dishes  (Bearer auth required)
 * Adds a live dish, optionally creating its restaurant inline.
 * IDEMPOTENT: a duplicate dish (or duplicate new restaurant) returns 200 with
 * { existed: true } and the existing row — never a dead-end 409. See the
 * 2026-07-05 cold-start retry fixes for why.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { verifyNhostJwt } from "@/lib/jwt";
import { validateAddDish } from "@/lib/reverse-lookup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);
const isDuplicate = (msg: string) => /unique|duplicate/i.test(msg);

async function findRestaurant(city: string, name: string) {
  const res = await graphql<{ restaurants: Array<{ id: string; name: string }> }>(
    `query ($city: String!, $name: String!) {
       restaurants(where: { city: { _eq: $city }, name: { _ilike: $name } }, limit: 1) { id name }
     }`,
    { useAdminSecret: true, variables: { city, name: likeEscape(name) } }
  );
  return res.data?.restaurants?.[0] ?? null;
}

async function findDish(restaurantId: string, name: string) {
  const res = await graphql<{ restaurant_dishes: Array<{ id: string; name: string }> }>(
    `query ($rid: uuid!, $name: String!) {
       restaurant_dishes(where: { restaurant_id: { _eq: $rid }, name: { _ilike: $name } }, limit: 1) { id name }
     }`,
    { useAdminSecret: true, variables: { rid: restaurantId, name: likeEscape(name) } }
  );
  return res.data?.restaurant_dishes?.[0] ?? null;
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const caller = verifyNhostJwt(token);
  if (!caller) return NextResponse.json({ error: "Sign in to add a dish" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const input = validateAddDish(body);
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });
  const city = "seattle"; // single-city v1; schema is city-ready

  try {
    // Resolve the venue: given id, or create inline (duplicate → reuse existing).
    let restaurantId = input.restaurantId;
    if (!restaurantId && input.newRestaurant) {
      const nr = input.newRestaurant;
      const res = await graphql<{ insert_restaurants_one: { id: string } | null }>(
        `mutation ($obj: restaurants_insert_input!) {
           insert_restaurants_one(object: $obj) { id }
         }`,
        {
          useAdminSecret: true,
          variables: {
            obj: {
              city, name: nr.name, website: nr.website, created_by: caller.userId,
              locations: { data: [{ address: nr.address, neighborhood: nr.neighborhood }] },
            },
          },
        }
      );
      if (res.errors?.length) {
        if (!isDuplicate(res.errors[0].message)) throw new Error(res.errors[0].message);
        restaurantId = (await findRestaurant(city, nr.name))?.id ?? null;
      } else {
        restaurantId = res.data?.insert_restaurants_one?.id ?? null;
      }
    }
    if (!restaurantId) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

    const res = await graphql<{ insert_restaurant_dishes_one: { id: string } | null }>(
      `mutation ($obj: restaurant_dishes_insert_input!) {
         insert_restaurant_dishes_one(object: $obj) { id }
       }`,
      {
        useAdminSecret: true,
        variables: {
          obj: {
            restaurant_id: restaurantId, name: input.name, description: input.description,
            tags: input.tags, created_by: caller.userId,
          },
        },
      }
    );
    if (res.errors?.length) {
      if (!isDuplicate(res.errors[0].message)) throw new Error(res.errors[0].message);
      const existing = await findDish(restaurantId, input.name);
      return NextResponse.json({ ok: true, existed: true, dishId: existing?.id ?? null, restaurantId });
    }
    return NextResponse.json({ ok: true, dishId: res.data?.insert_restaurant_dishes_one?.id, restaurantId });
  } catch {
    return NextResponse.json({ error: "Couldn't add the dish right now" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Build check + commit** — `git commit -m "feat(reverse-lookup): add-dish API with inline restaurant creation"`

---

### Task 6: API — PUT vote

**Files:**
- Create: `app/api/reverse-lookup/dishes/[id]/vote/route.ts`

- [ ] **Step 1: Implement**

```ts
/**
 * PUT /api/reverse-lookup/dishes/[id]/vote  (Bearer auth required)
 * Body { value: 1 | -1 | null, isLocal?: boolean } — isLocal defaults true.
 * Upserts on (dish_id, user_id); null deletes. Idempotent by construction.
 * Returns fresh per-cohort totals for optimistic-UI reconciliation.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { verifyNhostJwt } from "@/lib/jwt";
import { aggregateVotes, validateVote } from "@/lib/reverse-lookup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const caller = verifyNhostJwt(token);
  if (!caller) return NextResponse.json({ error: "Sign in to vote" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const input = validateVote(body);
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

  try {
    if (input.value === null) {
      const res = await graphql(
        `mutation ($dish: uuid!, $user: uuid!) {
           delete_restaurant_dish_votes_by_pk(dish_id: $dish, user_id: $user) { dish_id }
         }`,
        { useAdminSecret: true, variables: { dish: params.id, user: caller.userId } }
      );
      if (res.errors?.length) throw new Error(res.errors[0].message);
    } else {
      const res = await graphql(
        `mutation ($obj: restaurant_dish_votes_insert_input!) {
           insert_restaurant_dish_votes_one(
             object: $obj,
             on_conflict: { constraint: restaurant_dish_votes_pkey, update_columns: [value, voter_kind, updated_at] }
           ) { dish_id }
         }`,
        {
          useAdminSecret: true,
          variables: {
            obj: {
              dish_id: params.id, user_id: caller.userId, value: input.value,
              voter_kind: input.voterKind, updated_at: new Date().toISOString(),
            },
          },
        }
      );
      if (res.errors?.length) {
        // FK violation = dish id doesn't exist (or was removed).
        if (/foreign key/i.test(res.errors[0].message)) {
          return NextResponse.json({ error: "Dish not found" }, { status: 404 });
        }
        throw new Error(res.errors[0].message);
      }
    }

    const totals = await graphql<{ restaurant_dish_votes: Array<{ value: number; voter_kind: string }> }>(
      `query ($dish: uuid!) {
         restaurant_dish_votes(where: { dish_id: { _eq: $dish } }) { value voter_kind }
       }`,
      { useAdminSecret: true, variables: { dish: params.id } }
    );
    const { locals, visitors } = aggregateVotes(totals.data?.restaurant_dish_votes ?? []);
    return NextResponse.json({
      ok: true, locals, visitors,
      myVote: input.value === null ? null : { value: input.value, isLocal: input.voterKind !== "visitor" },
    });
  } catch {
    return NextResponse.json({ error: "Couldn't save your vote right now" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Build check + commit** — `git commit -m "feat(reverse-lookup): cohort vote API (upsert/delete)"`

---

### Task 7: API — admin PATCH (hide/unhide)

**Files:**
- Create: `app/api/reverse-lookup/dishes/[id]/route.ts`

- [ ] **Step 1: Implement**

```ts
/**
 * PATCH /api/reverse-lookup/dishes/[id]  (x-admin-secret header)
 * { status: "hidden" | "live" } — moderation killswitch for community dishes.
 */
import { NextRequest, NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { adminGuard } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = adminGuard(request);
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (status !== "hidden" && status !== "live") {
    return NextResponse.json({ error: "status must be 'hidden' or 'live'" }, { status: 400 });
  }

  try {
    const res = await graphql<{ update_restaurant_dishes_by_pk: { id: string } | null }>(
      `mutation ($id: uuid!, $status: String!) {
         update_restaurant_dishes_by_pk(pk_columns: { id: $id }, _set: { status: $status }) { id }
       }`,
      { useAdminSecret: true, variables: { id: params.id, status } }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);
    if (!res.data?.update_restaurant_dishes_by_pk) {
      return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, status });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Build check + commit** — `git commit -m "feat(reverse-lookup): admin hide/unhide endpoint"`

---

### Task 8: `/login?next=` redirect support

**Files:**
- Modify: `components/auth/LoginForm.tsx` (post-sign-in navigation, around lines 47-55)

- [ ] **Step 1: Add the param read + validation**

At the top of the component add:
```tsx
import { useSearchParams } from "next/navigation";
// inside the component:
const searchParams = useSearchParams();
// Same-origin path only: must start with "/", must not be protocol-relative "//".
const rawNext = searchParams.get("next");
const nextPath = rawNext && /^\/(?!\/)/.test(rawNext) ? rawNext : null;
```

Change the destination line:
```tsx
const dest = nextPath ?? landingPathForUserType(userType as UserType | null | undefined);
```

Check whether the component is wrapped in `<Suspense>` where used (useSearchParams requires it under app router prerendering; `app/login/page.tsx` renders it directly). If the build errors with "useSearchParams should be wrapped in a Suspense boundary", wrap `<LoginForm />` in `app/login/page.tsx` (and the `@modal` login slot) with `<Suspense>`.

- [ ] **Step 2: Build** — `bun run build 2>&1 | tail -5` → succeeds.
- [ ] **Step 3: Commit** — `git commit -m "feat(auth): honor same-origin ?next= redirect after login"`

---

### Task 9: UI primitives — CuteFace + YumMeter

**Files:**
- Create: `app/reverse-lookup/components/CuteFace.tsx`
- Create: `app/reverse-lookup/components/YumMeter.tsx`

- [ ] **Step 1: Port CuteFace** from `docs/superpowers/specs/assets/yum-lookup-sample/app.jsx:175-222` as a typed client component. Keep the SVG geometry EXACTLY as the sample (mouths map, heart eyes for "love", cheeks, leaf sprig). Signature:

```tsx
"use client";
export type Mood = "love" | "happy" | "smile" | "neutral" | "sad";
export function CuteFace({ mood = "happy", size = 44, fill = "#FFD980", stroke = "#1C3A2E" }:
  { mood?: Mood; size?: number; fill?: string; stroke?: string }) { /* sample SVG verbatim */ }
```

Add one extra: a `gray` fill preset for tallying states — callers pass `fill="#D6D3CE"`.

- [ ] **Step 2: YumMeter** — two cohort blocks, three states each, driven entirely by `meterState()` from lib:

```tsx
"use client";
import { CuteFace } from "./CuteFace";
import { meterState, type VoteTotals } from "@/lib/reverse-lookup";

const FACE_FILLS: Record<string, string> = {
  love: "#A6D8B0", yum: "#C8E0A0", tasty: "#FFE08A", meh: "#F4B987", skip: "#F2A39A",
};

function ScoreBlock({ label, totals }: { label: string; totals: VoteTotals }) {
  const s = meterState(totals);
  if (s.state === "scored") {
    return (
      <div className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: s.tier.soft }}>
        <CuteFace mood={s.tier.face} fill={FACE_FILLS[s.tier.key]} />
        <div>
          <div className="text-[10px] font-bold tracking-wide text-neutral-500">{label}</div>
          <div className="text-xl font-extrabold leading-tight" style={{ color: s.tier.color }}>
            {s.pct}<span className="text-xs">%</span>
          </div>
          <div className="text-[11px] font-semibold" style={{ color: s.tier.color }}>
            {s.tier.label} <span className="font-normal text-neutral-500">· {s.votes} votes</span>
          </div>
        </div>
      </div>
    );
  }
  // Tallying / empty: neutral gray face, NO percentage (avoids anchoring voters).
  return (
    <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-neutral-100 px-3 py-2.5">
      <CuteFace mood="neutral" fill="#D6D3CE" />
      <div>
        <div className="text-[10px] font-bold tracking-wide text-neutral-500">{label}</div>
        <div className="text-[12px] font-medium text-neutral-500">
          {s.state === "tallying"
            ? <>Still tallying the votes… <span className="whitespace-nowrap">· {s.votes} so far</span></>
            : "No votes yet — be the first."}
        </div>
      </div>
    </div>
  );
}

export function YumMeter({ locals, visitors }: { locals: VoteTotals; visitors: VoteTotals }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <ScoreBlock label="LOCALS SAY" totals={locals} />
      <ScoreBlock label="VISITORS SAY" totals={visitors} />
    </div>
  );
}
```

- [ ] **Step 3: Build check + commit** — `git commit -m "feat(reverse-lookup): CuteFace + YumMeter components"`

---

### Task 10: VoteWidget + DishCard

**Files:**
- Create: `app/reverse-lookup/components/VoteWidget.tsx`
- Create: `app/reverse-lookup/components/DishCard.tsx`

- [ ] **Step 1: VoteWidget** — thumbs input + per-vote local toggle (default local, remembered in localStorage) + signed-out gate:

```tsx
"use client";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePersistentState } from "@/lib/usePersistentState";

export type MyVote = { value: 1 | -1; isLocal: boolean } | null;

export function VoteWidget({ myVote, onVote }: {
  myVote: MyVote;
  /** value null = remove vote. Caller does the optimistic update + API call. */
  onVote: (value: 1 | -1 | null, isLocal: boolean) => void;
}) {
  const { isAuthenticated } = useAuth();
  const [isLocal, setIsLocal] = usePersistentState<boolean>("rl-voter-is-local", true);
  const [showGate, setShowGate] = useState(false);

  const cast = (value: 1 | -1) => {
    if (!isAuthenticated) { setShowGate(true); return; }
    onVote(myVote?.value === value ? null : value, isLocal);
  };

  const btn = (value: 1 | -1, glyph: string) => (
    <button
      type="button"
      onClick={() => cast(value)}
      aria-pressed={myVote?.value === value}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
        myVote?.value === value
          ? "border-apb bg-apb text-white"
          : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {glyph}
    </button>
  );

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-neutral-600">Was it good?</span>
      {btn(1, "👍")}
      {btn(-1, "👎")}
      <button
        type="button"
        onClick={() => setIsLocal(!isLocal)}
        className="ml-1 rounded-full border border-dashed border-neutral-300 px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50"
        title="Your vote counts toward this group's score"
      >
        as {isLocal ? "🏠 Local" : "🧳 Visiting"} ▾
      </button>
      {showGate && (
        <span className="text-xs text-neutral-600">
          <a className="font-semibold text-apb underline" href="/login?next=/reverse-lookup">Sign in</a> to vote — it takes a minute.
        </span>
      )}
    </div>
  );
}
```

Check `lib/usePersistentState.ts` for its actual signature first and match it; if it doesn't fit, use a local `useState` + `useEffect` localStorage pair.

- [ ] **Step 2: DishCard** — header (name, tag pill, "from RESTAURANT · neighborhood", verified badge), YumMeter, description, details rows (flavors / ingredients / allergens from `details` jsonb, same layout as the old static card), address + website footer, VoteWidget, "added by @handle" when present.

Follow the old static page's information order (`docs/superpowers/specs/assets/yum-lookup-sample/app.jsx:348-411` DishCard) with the app's Tailwind styling. Props:

```tsx
export type CatalogDish = {
  id: string; restaurantId: string; restaurantName: string; verified: boolean;
  website: string | null;
  location: { address: string; neighborhood: string | null } | null;
  name: string; description: string | null; tags: string[];
  details: { ingredients?: string[]; allergens?: Array<{ name: string; optional?: boolean }>; flavors?: string[] };
  createdAt: string; addedBy: string | null;
  locals: VoteTotals; visitors: VoteTotals; myVote: MyVote;
};

export function DishCard({ dish, onVote }: { dish: CatalogDish; onVote: (dishId: string, value: 1 | -1 | null, isLocal: boolean) => void });
```

- [ ] **Step 3: Build check + commit** — `git commit -m "feat(reverse-lookup): dish card with vote widget and local/visitor toggle"`

---

### Task 11: RestaurantCard + LeaderboardView

**Files:**
- Create: `app/reverse-lookup/components/RestaurantCard.tsx`
- Create: `app/reverse-lookup/components/LeaderboardView.tsx`

- [ ] **Step 1: RestaurantCard** — name, cuisine pills, description, one 📍 line per location (address + neighborhood), website/instagram links, dish count, and the contribution hook: "Know their menu? **+ Add a dish**" button that opens AddDishModal pre-selected to this restaurant (prop `onAddDish(restaurantId)`).

- [ ] **Step 2: LeaderboardView** — port the sample's leaderboard page (`assets/yum-lookup-sample/app.jsx:417-515`) to real data:

```tsx
"use client";
import { useMemo, useState } from "react";
import { CuteFace } from "./CuteFace";
import { leaderboardCategories, rankLeaderboard, overallTotals, scorePct, tierFor, meterState } from "@/lib/reverse-lookup";
import type { CatalogDish } from "./DishCard";
```

- Category pills from `leaderboardCategories(dishes)`; empty state when none qualify: gray face + "No leaderboards yet — dishes need 5 votes to rank. Get voting!"
- Rows: rank number, `CHAMP` badge on index 0 (highlighted row), mood-face thumb colored by overall tier, dish name, "RESTAURANT · neighborhood", description line, then two score blocks (LOCALS / VISITORS) reusing the same three-state rendering as YumMeter (extract `ScoreBlock` from YumMeter into its own export to reuse — keep it in `YumMeter.tsx`).
- Ranked by `rankLeaderboard(dishes, activeTag)`.

- [ ] **Step 3: Build check + commit** — `git commit -m "feat(reverse-lookup): restaurant directory card + leaderboards view"`

---

### Task 12: AddDishModal (two steps)

**Files:**
- Create: `app/reverse-lookup/components/AddDishModal.tsx`

- [ ] **Step 1: Implement** using `components/ui/modal.tsx` + `components/ui/input.tsx`:

Step "where": searchable restaurant list (filter the already-loaded `restaurants` prop by name/neighborhood as the user types; radio-style selection). A "+ New restaurant" toggle expands inline fields: name*, street address*, neighborhood, website. Continue button advances.

Step "what": dish name*, one-line description, tag chips (union of existing dish tags as toggleable chips + free-text input to add). While typing the name, duplicate check against the loaded catalog for the chosen restaurant (case-insensitive): show "Already listed at this restaurant — vote it up instead" with an `onJumpToDish(dishId)` link and disable submit.

Submit → POST `/api/reverse-lookup/dishes` with `Authorization: Bearer ${session?.accessToken}` (from `useAuth()`); body per Task 5. On `existed: true`, treat as success and jump to the existing dish. On success call `onAdded(dishId)` so the page refetches + scrolls + highlights.

Auth gate: if not `isAuthenticated`, the page shouldn't open the modal at all — the [+ Add] button shows the sign-in prompt instead (Task 13).

- [ ] **Step 2: Build check + commit** — `git commit -m "feat(reverse-lookup): two-step add-dish modal with inline restaurant creation"`

---

### Task 13: Page shell — tabs, search, fetching, optimistic votes

**Files:**
- Create: `app/reverse-lookup/page.tsx`
- Modify: `app/reverse-lookup/components/AddDishModal.tsx` (401 → sign-in prompt handling)

- [ ] **Step 1: Implement the client page**

```tsx
"use client";
```

State + behavior:
- On mount fetch `/api/reverse-lookup/catalog?city=seattle`, with `Authorization` header when `session?.accessToken` exists (refetch when auth state changes so `myVote` hydrates).
- Hero: eyebrow "Reverse Lookup · Seattle", title "Tell us what you're craving — we'll tell you *where to find it vegan*.", the search input (token-AND matching over dish name/description/tags/details.ingredients/restaurant name/neighborhood — port the haystack logic from the old `public/reverse-lookup/app.jsx:44-67`), result count.
- Tabs: `Dishes (n)` / `Restaurants (n)` / `Leaderboards` + `[+ Add]` button. Sticky category-pill row under the header on the Dishes tab (tag vocabulary), mirroring the `/dishes` sticky filter pattern.
- Dishes tab: `sortDishCards(filtered)` → `DishCard` list; empty state invites adding. **When a search query is active**, apply a name-adjacency pass after sorting: group cards sharing `lower(name)` adjacently, keeping each group at the position of its highest-sorted member (spec: same-named dishes at different venues appear together in search results).
- Restaurants tab: search filters by name/neighborhood/cuisine; `RestaurantCard` list.
- Leaderboards tab: `LeaderboardView dishes={allDishes}`.
- Optimistic voting: `onVote(dishId, value, isLocal)` updates the dish's cohort totals + `myVote` in state immediately (move the previous vote out of its old cohort/direction first — derive from previous `myVote`), then `PUT /api/reverse-lookup/dishes/{id}/vote`; on success overwrite with server totals; on **401** revert and show the sign-in prompt (token expired — "Session expired, sign in again" linking `/login?next=/reverse-lookup`); on other failures revert and show an inline error toast. AddDishModal handles 401 the same way.
- `[+ Add]`: signed-in → AddDishModal; signed-out → popover "Sign in to add a dish — it takes a minute" linking `/login?next=/reverse-lookup`.
- Error state: full-width error card with a Retry button.
- Loading state: "Loading the catalog…" (match old page copy).

- [ ] **Step 2: Full build + tests** — `bun run build && bun test` → both green.
- [ ] **Step 3: Commit** — `git commit -m "feat(reverse-lookup): app-router page with tabs, search, optimistic voting"`

---

### Task 14: Seed script (write, do NOT run)

**Files:**
- Create: `scripts/seed-reverse-lookup.ts`

- [ ] **Step 1: Implement** (bun script; Bun auto-loads `.env` / `.env.local`)

Flow:
1. Only when `--execute` is passed: read env `NHOST_SUBDOMAIN`, `NHOST_REGION`, `NHOST_GRAPHQL_SECRET` and abort loudly if missing. The dry-run path never reads env or opens a connection.
2. `parseSvgCsv(await Bun.file("scripts/data/svg-guide-2026-06-29.csv").text())` → seed restaurants, `verified: true`, `last_verified` from CSV.
3. Read `scripts/data/seattle-dishes.json`; for each dish × restaurant entry: ensure the venue exists (match by `lower(name)` against CSV set + already-inserted; else insert with its address/city fields, `verified: true`), then insert the dish with `tags`, and `details` = `{ ingredients, allergens, flavors, locallyMade }` (only defined keys).
4. All inserts are **idempotent**: check-then-insert against `(city, lower(name))` / `(restaurant_id, lower(name))` — re-running the script must be a no-op (print `created` vs `existed` counts).
5. `--dry-run` flag (default!): **purely local** — parse both data files and print the would-be insert plan WITHOUT touching the network. This matters because the tables don't exist until the user applies the migration (Task 16); a dry-run that queried the DB would fail pre-migration. Only `--execute` opens a GraphQL connection (and does its existence checks then).

```
Usage: bun scripts/seed-reverse-lookup.ts            # dry-run: local parse + printed plan, no network
       bun scripts/seed-reverse-lookup.ts --execute  # writes to the DB (post-migration, user-gated)
```

- [ ] **Step 2: Verify the dry-run (no network)** — `bun scripts/seed-reverse-lookup.ts` → prints ~27+ restaurants (26 CSV + seattle.json venues not in CSV, e.g. Three Cats Cafe, Next Level Burger), a handful of dishes, writes nothing, opens no connection.
- [ ] **Step 3: Commit** — `git commit -m "feat(reverse-lookup): idempotent seed script (dry-run by default)"`

**🛑 Do NOT run `--execute`. The user is adding restaurants to the CSV first and gives the explicit go (see memory: reverse-lookup-seed-gate).**

---

### Task 15: Retire the static page

**Files:**
- Modify: `middleware.ts:5-11` — remove `"reverse-lookup"` from `STATIC_APPS`
- Delete: `public/reverse-lookup/` (whole directory — app.jsx, index.html, styles.css, data/)
- Delete: `app/api/reverse-lookup/suggest/route.ts` (superseded by the sign-in add flow; the `reverse_lookup_suggestions` TABLE stays untouched)

- [ ] **Step 0: Remove the middleware rewrite** — `middleware.ts` rewrites `/reverse-lookup` → `/reverse-lookup/index.html` (STATIC_APPS list). Delete the `"reverse-lookup",` entry, or the new app-router page stays shadowed (and 404s once the static dir is gone). The other four slugs stay.

- [ ] **Step 1: Check for internal links first**

```bash
grep -rn "reverse-lookup" app components lib middleware.ts --include="*.tsx" --include="*.jsx" --include="*.ts" | grep -v "app/reverse-lookup\|app/api/reverse-lookup\|lib/reverse-lookup"
```
Fix any hits (e.g. nav links pointing at `/reverse-lookup/index.html` → `/reverse-lookup`). Known keeper: `components/SiteNav.tsx` `KNOWN_SECTIONS` includes `"reverse-lookup"` — leave it; the URL is still a real section.

- [ ] **Step 2: Delete + verify**

```bash
git rm -r public/reverse-lookup app/api/reverse-lookup/suggest
bun run build 2>&1 | tail -5   # succeeds; /reverse-lookup is the app route now
bun test                        # all green
```

- [ ] **Step 3: Commit** — `git commit -m "feat(reverse-lookup): retire static page + anonymous suggest endpoint"`

---

### Task 16: Verification + launch checklist (user-gated)

- [ ] **Step 1: Full local verification**

```bash
bun test                       # all suites green
bun run build 2>&1 | tail -5   # clean build
```

- [ ] **Step 2: Read-only browser pass on localhost** (REMEMBER: prod DB — look, don't write)
- `/reverse-lookup` serves the NEW app-router page (middleware rewrite removed in Task 15) — not a 404, not the old static page.
- **Pre-migration expectation:** the tables don't exist yet, so `/api/reverse-lookup/catalog` returns 502 and the page must show its error card + Retry — that IS the pass criterion at this stage. Hero, tabs, search chrome, and the signed-out gates must still render around it.
- Signed-out: vote buttons show the sign-in prompt; [+ Add] shows the sign-in prompt; `/login?next=/reverse-lookup` round-trips back.
- Do NOT add dishes or vote from localhost.
- The full happy-path check (catalog renders, voting, adding) happens on the deployed site AFTER the user applies the migration and seed (Step 3).

- [ ] **Step 3: Hand off to the user — the launch gate.** Everything below is the USER's call, in order:
1. User extends `scripts/data/svg-guide-2026-06-29.csv` with their extra restaurants.
2. Apply the migration + metadata in `backend_migrations` (their usual nhost deploy flow).
3. `bun scripts/seed-reverse-lookup.ts` (dry-run review) → `--execute` on their go.
4. Deploy the app; verify voting/adding **on the deployed site** with a real account.
5. Optional cleanup: triage old `reverse_lookup_suggestions` rows manually.
