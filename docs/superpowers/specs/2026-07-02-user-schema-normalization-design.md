# User Schema Normalization: Business vs Consumer Split

**Date:** 2026-07-02 (v2: 2026-07-03)
**Status:** Backend implemented & verified — frontend wiring pending
**Scope:** Normalize user profile data, split business/consumer roles, add dish
ownership, and introduce creators (recipe sources) as claimable entities.

## Overview

User profile data (handle, user_type, role, zip_code) previously lived in
Nhost's `auth.users.metadata` as JSON. This design replaces that with a proper
relational schema: a shared `users` table plus type-specific `business_users`
and `consumer_users` tables, dish ownership, and a `creators` table for recipe
sources.

## Migrations (in `backend_migrations`, branch `feat/user-schema-normalization`)

- `1783052535801_normalize_user_schema` — users + business_users + consumer_users, domains, dishes.user_id
- `1783052535802_add_creators_table` — creators + 56 seeded recipe sources
- Fix: `1782237340634_add_review_instance_table/down.sql` was a comment-only stub; now drops the table + domain (see Down-migration audit).

## Schema

### `users` — shared base (unchanged coupling to auth)

```sql
CREATE TABLE public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle     VARCHAR(20) NOT NULL,
  user_type  user_type_enum NOT NULL,   -- domain, not enum/raw string
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()   -- bumped by trigger
);
CREATE UNIQUE INDEX users_handle_lower_idx ON public.users (lower(handle));  -- ci-unique
```

`id` is 1:1 with the Nhost auth user. Real accounts only.

### `business_users` / `consumer_users` — type-specific profiles

```sql
CREATE TABLE public.business_users (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  role    business_role_enum NOT NULL,   -- 'restaurant' | 'chef'
  ...
);
CREATE TABLE public.consumer_users (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  role    consumer_role_enum NOT NULL,   -- 'homecook' | 'enthusiast' | 'first-timer'
  ...
);
```

The row's existence + the role domain make a role/user_type mismatch
structurally impossible — no app-layer enforcement needed.

### Domains over enums/raw strings

`user_type_enum`, `business_role_enum`, `consumer_role_enum` are Postgres
DOMAINs (matching the repo's existing `chef_type_enum`). Chosen because a
domain's CHECK is **mutable** via `ALTER DOMAIN` — adding/removing a role later
is a one-liner that applies everywhere the domain is used, unlike enums.

### `dishes` — ownership

```sql
ALTER TABLE public.dishes ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
CREATE INDEX dishes_user_id_idx ON public.dishes (user_id);
```

Nullable: legacy/ownerless dishes stay valid; on user deletion the dish survives
with a NULL author.

### `creators` — recipe sources, claimable

```sql
CREATE TABLE public.creators (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),   -- decoupled from auth/users
  display_name TEXT NOT NULL,
  owner_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,  -- NULL = unclaimed
  ...
);
CREATE UNIQUE INDEX creators_display_name_lower_idx ON public.creators (lower(display_name));
```

**Design fork resolved:** creators are "not yet on the platform," so they have no
auth account. Rather than decoupling `users.id` from `auth.users` (which would
force a nullable auth link + a `'creator'` user_type + join gymnastics on every
read), creators live in their own table. `owner_id IS NULL` means unclaimed; a
real user claims a creator via a single in-place `UPDATE owner_id`. The common
read path (recipe-source dropdown, source attribution) is a single-table scan;
we only join to `users`/auth on the rare "who owns this creator" lookup.

Seeded with 56 recipe sources (Nora Cooks, Vegan Richa, Rainbow Plant Life, …)
extracted from recipe `source` fields, excluding internal/study entries.

## Application Flow

### Sign Up / Sign In
- Sign up: create `auth.users` (Nhost) → create `users` → create the matching
  `business_users`/`consumer_users` row. (Signup-trigger atomicity is a
  recommended hardening — see Open items.)
- Sign in: `AuthProvider` reads `users` + type row instead of `metadata`.

### Dish / creator attribution
- Dish create: set `dishes.user_id = current user`.
- Recipe-source dropdown: select from `creators` (display_name).

## Down-migration audit (all validated)

Full up→down chain tested against ephemeral Postgres: all 17 migrations apply
and roll back cleanly, zero residue (only `pg_trgm` extension internals remain,
correctly). Fixed one comment-only stub down.sql (`add_review_instance_table`).

## Open items / not yet done

- **Hasura permissions / RLS** — new tables are registered in metadata but need
  row permissions keyed to `X-Hasura-User-Id` before GraphQL exposure.
- **Signup atomicity** — trigger on `auth.users` insert to populate `users` +
  type row in one transaction (avoids orphaned auth users).
- **`AuthProvider`** — switch from `metadata` reads to `users` table.
- **Metadata backfill + drop** — migrate existing `auth.users.metadata` → tables.
- **Dish instances / Active Dishes (goal #5)** — `review_instance.author_id` FK →
  `users`, Active Dishes page + "make active (24h QR reviews)" popup.
  *To be implemented on a separate branch via subagent.*
- **Recipe/dish → creator FK** — wire the dropdown selection to a `creator_id`.
```
