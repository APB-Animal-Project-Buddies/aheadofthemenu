-- Allergens associated with each pool ingredient (e.g. {nuts}, {gluten}). Used to
-- auto-populate a recipe's allergen list as ingredients are added.
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS allergens TEXT[] NOT NULL DEFAULT '{}';
