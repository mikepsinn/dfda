-- Table: models.population_demographics

CREATE TABLE models.population_demographics (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    population_segment_id bigint NOT NULL REFERENCES reference.population_segments(id),
    parameter_set_id bigint NOT NULL REFERENCES models.parameter_sets(id),
    age_group text NOT NULL,
    percentage numeric NOT NULL CHECK (percentage BETWEEN 0 AND 100),
    risk_multiplier numeric NOT NULL DEFAULT 1.0,
    population_count bigint,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
