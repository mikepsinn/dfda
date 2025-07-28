-- Table: models.intervention_effects

CREATE TABLE models.intervention_effects (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    intervention_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    outcome_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    population_segment_id bigint NOT NULL REFERENCES reference.population_segments(id),
    parameter_set_id bigint NOT NULL REFERENCES models.parameter_sets(id),
    effect_type text NOT NULL CHECK (effect_type IN ('relative_risk', 'absolute_change', 'percent_change', 'odds_ratio')),
    effect_size numeric NOT NULL,
    confidence_interval_low numeric,
    confidence_interval_high numeric,
    time_horizon_months integer,
    evidence_level text,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
