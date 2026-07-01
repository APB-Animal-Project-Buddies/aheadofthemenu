-- When a cook makes a dish with substitutions, the allergens can differ from the
-- base recipe. Capture whether they substituted, which swaps they made, and the
-- allergens of their version.
ALTER TABLE review_instance ADD COLUMN IF NOT EXISTS substituted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE review_instance ADD COLUMN IF NOT EXISTS allergens TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE review_instance ADD COLUMN IF NOT EXISTS substitutions JSONB NOT NULL DEFAULT '[]';
