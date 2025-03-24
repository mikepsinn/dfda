-- Intervention effects table for storing effect sizes
CREATE TABLE models.intervention_effects (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    intervention_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    outcome_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
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

-- Enable row level security
ALTER TABLE models.intervention_effects ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.intervention_effects
    FOR SELECT USING (true);

COMMENT ON TABLE models.intervention_effects IS 'Effect sizes of interventions on outcome variables for specific populations';
COMMENT ON COLUMN models.intervention_effects.intervention_variable_id IS 'Reference to the intervention variable';
COMMENT ON COLUMN models.intervention_effects.outcome_variable_id IS 'Reference to the outcome being affected';
COMMENT ON COLUMN models.intervention_effects.effect_type IS 'Type of effect (relative risk, absolute change, etc.)';
COMMENT ON COLUMN models.intervention_effects.time_horizon_months IS 'Time horizon for the effect in months';
COMMENT ON COLUMN models.intervention_effects.evidence_level IS 'Level of evidence supporting the effect size'; 