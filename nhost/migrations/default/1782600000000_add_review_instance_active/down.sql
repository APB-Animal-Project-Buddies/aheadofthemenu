DROP INDEX IF EXISTS review_instance_author_active_idx;
ALTER TABLE review_instance DROP COLUMN IF EXISTS active_until;
ALTER TABLE review_instance DROP COLUMN IF EXISTS author_id;
