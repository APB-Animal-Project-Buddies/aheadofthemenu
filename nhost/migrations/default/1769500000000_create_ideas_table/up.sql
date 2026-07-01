CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea TEXT NOT NULL,
    sub_ideas TEXT,
    other_notes TEXT,
    contact_email TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ideas_sort_order ON ideas(sort_order ASC);
