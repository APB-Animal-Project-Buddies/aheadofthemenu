# User Schema Normalization: Business vs Consumer Split

**Date:** 2026-07-02  
**Status:** Design (pending review)  
**Scope:** MVP — normalize user profile data, split business/consumer roles, add dish ownership

## Overview

Currently, user profile data (handle, user_type, role, zip_code) lives in Nhost's `auth.users.metadata` as JSON. This design replaces that with a proper relational schema: a shared `users` table, plus type-specific `business_users` and `consumer_users` tables. This foundation enables business features (inventory, addresses, etc.) and improves queryability.

## Current State

- **auth.users** (Nhost): Auth credentials + metadata JSON
- **metadata fields**: handle, user_type ("business"|"consumer"), role, zip_code
- **roles**: restaurant, chef (business); homecook, enthusiast, first-timer (consumer)
- **dishes table**: No user_id column (no ownership tracking)

## Proposed Schema

### New Tables

```sql
-- Shared user base (app-level, not Nhost)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle VARCHAR(20) UNIQUE NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('business', 'consumer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Business-specific profile
CREATE TABLE business_users (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Consumer-specific profile
CREATE TABLE consumer_users (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Modified Tables

```sql
-- Add ownership tracking to dishes
ALTER TABLE dishes ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for "dishes by creator" queries
CREATE INDEX dishes_user_id_idx ON dishes(user_id);
```

## Data Migration

1. **Backfill** auth.users.metadata → users + (business_users|consumer_users)
   - Extract handle and user_type from metadata
   - Create users row with auth.users.id, handle, user_type
   - Create business_users or consumer_users row (FK to users.id)
2. **Update AuthProvider** to read from users table instead of metadata
3. **Drop** users.metadata column (safe after backfill)

## Application Flow

### Sign Up
1. Create auth.users (via Nhost SDK)
2. Create users row (handle, user_type from signup form)
3. Create business_users or consumer_users row

### Sign In
1. Nhost SDK authenticates
2. AuthProvider queries: users + (business_users|consumer_users) by user_id
3. Expose handle, user_type, role via React context

### Dish Ownership
- When creating a dish: `INSERT INTO dishes (user_id, ...) VALUES (current_user_id, ...)`
- When fetching dishes: `SELECT ... FROM dishes LEFT JOIN users ON dishes.user_id = users.id`

## Future Additions (Not in MVP)

- **creators** table (original recipe authors: Nora Cooks, Vegan Richa, etc.)
- **business_users** fields: business_name, business_addresses, etc.
- **consumer_users** fields: dietary_restrictions, cuisine_preferences, etc.
- **Preferences** column on users (shared across user types)

## Error Handling & Constraints

- **Handle uniqueness**: Enforced via UNIQUE index on users(handle)
- **Referential integrity**: CASCADE deletes on user_id (dishes revert to NULL author if user deleted)
- **User type consistency**: business_users and consumer_users are mutually exclusive (enforced at app layer for now)

## Testing Strategy

- **Unit**: Backfill query correctness (handle migration, user_type assignment)
- **Integration**: Sign up/sign in with new schema; AuthProvider reads correct profile
- **End-to-end**: Create dish → verify user_id stored → query "my dishes" by user_id

## Rollback Plan

- Keep auth.users.metadata intact during migration (don't drop column immediately)
- If issues: revert to reading metadata, skip users table queries
- After 2 weeks stable: drop metadata column
