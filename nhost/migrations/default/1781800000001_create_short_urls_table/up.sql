CREATE TABLE short_urls (
    short_code  TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
