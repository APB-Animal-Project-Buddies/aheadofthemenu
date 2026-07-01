-- Proposed edits to a dish, pending admin review. Stores a full proposed snapshot
-- of dish_data; on approval the dish's dish_data is replaced with it.
CREATE TABLE IF NOT EXISTS dish_edits (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id       INT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    proposed_data JSONB NOT NULL,
    proposer      JSONB,
    note          TEXT,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_dish_edits_status ON dish_edits(status);
CREATE INDEX IF NOT EXISTS idx_dish_edits_dish_id ON dish_edits(dish_id);
