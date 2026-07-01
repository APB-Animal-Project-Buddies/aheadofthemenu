CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id     INT REFERENCES dishes(id),
    review_data JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
