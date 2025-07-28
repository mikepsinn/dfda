-- Table: reference.population_segments

CREATE TABLE reference.population_segments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    age_min numeric,
    age_max numeric,
    condition_variable_id bigint REFERENCES reference.variables(id),
    demographic_filters jsonb,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
