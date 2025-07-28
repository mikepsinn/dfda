-- Table: models.simulation_outputs

CREATE TABLE models.simulation_outputs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    run_name text NOT NULL,
    run_timestamp timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    parameter_set_id bigint NOT NULL REFERENCES models.parameter_sets(id),
    population_segment_id bigint NOT NULL REFERENCES reference.population_segments(id),
    intervention_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    outcome_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    time_point timestamptz NOT NULL,
    value numeric NOT NULL,
    -- QALY specific fields
    is_qaly_calculation boolean DEFAULT false,
    qaly_type text CHECK (
        NOT is_qaly_calculation OR 
        qaly_type IN ('lifetime', 'annual', 'incremental')
    ),
    base_life_expectancy numeric,
    quality_adjustment_factor numeric CHECK (
        NOT is_qaly_calculation OR 
        quality_adjustment_factor BETWEEN 0 AND 1
    ),
    total_qalys numeric,
    qaly_monetary_value numeric,
    -- Common fields
    confidence_interval_low numeric,
    confidence_interval_high numeric,
    calculation_method text,
    assumptions text[],
    limitations text,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_qaly_fields CHECK (
        (is_qaly_calculation AND qaly_type IS NOT NULL AND base_life_expectancy IS NOT NULL 
         AND quality_adjustment_factor IS NOT NULL AND total_qalys IS NOT NULL 
         AND qaly_monetary_value IS NOT NULL)
        OR
        (NOT is_qaly_calculation AND qaly_type IS NULL AND base_life_expectancy IS NULL 
         AND quality_adjustment_factor IS NULL AND total_qalys IS NULL 
         AND qaly_monetary_value IS NULL)
    )
);
