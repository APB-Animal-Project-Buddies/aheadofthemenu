CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE ingredients (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    synonyms    TEXT[] NOT NULL DEFAULT '{}',
    norm_key    TEXT NOT NULL,
    search_text TEXT NOT NULL,
    alias_of    TEXT REFERENCES ingredients(id),
    off_id      TEXT,
    off_code    TEXT,
    vegan       BOOLEAN,
    source      TEXT NOT NULL DEFAULT 'off',
    added_ingredient BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ingredients_norm_key ON ingredients (norm_key);
CREATE INDEX idx_ingredients_search_trgm ON ingredients USING gin (search_text gin_trgm_ops);
