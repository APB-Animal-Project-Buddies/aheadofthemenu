-- "Active dish" support for review instances: who created it (author_id) and
-- when the review window closes (active_until). A dish instance is "active" when
-- active_until > now(); deactivating sets active_until = now(); it otherwise
-- auto-expires. is_active is derived, not stored.
ALTER TABLE review_instance ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE review_instance ADD COLUMN IF NOT EXISTS active_until TIMESTAMPTZ;

-- Fast lookup of a user's currently-active instances, newest/oldest first.
CREATE INDEX IF NOT EXISTS review_instance_author_active_idx
  ON review_instance (author_id, active_until);
