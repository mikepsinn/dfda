-- Simulation outputs table for storing model results
CREATE TABLE models.simulation_outputs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    run_name text NOT NULL,
    run_timestamp timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    parameter_set_id bigint NOT NULL REFERENCES models.parameter_sets(id),
    population_segment_id bigint NOT NULL REFERENCES reference.population_segments(id),
    intervention_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    outcome_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
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

-- Enable row level security
ALTER TABLE models.simulation_outputs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.simulation_outputs
    FOR SELECT USING (true);

-- Create index for time series queries
CREATE INDEX simulation_outputs_time_idx ON models.simulation_outputs (time_point);

-- Create index for QALY calculations
CREATE INDEX simulation_outputs_qaly_idx ON models.simulation_outputs (is_qaly_calculation) WHERE is_qaly_calculation;

COMMENT ON TABLE models.simulation_outputs IS 'Results from model simulations including projected outcomes and QALY calculations';
COMMENT ON COLUMN models.simulation_outputs.run_name IS 'Name/identifier for the simulation run';
COMMENT ON COLUMN models.simulation_outputs.value IS 'Projected value of the outcome variable at the given time point';
COMMENT ON COLUMN models.simulation_outputs.is_qaly_calculation IS 'Whether this row represents a QALY calculation';
COMMENT ON COLUMN models.simulation_outputs.qaly_type IS 'Type of QALY calculation (lifetime, annual, or incremental)';
COMMENT ON COLUMN models.simulation_outputs.quality_adjustment_factor IS 'Factor used to adjust life years for quality';
COMMENT ON COLUMN models.simulation_outputs.qaly_monetary_value IS 'Monetary value assigned to each QALY';
COMMENT ON COLUMN models.simulation_outputs.metadata IS 'Additional metadata about the simulation output'; 