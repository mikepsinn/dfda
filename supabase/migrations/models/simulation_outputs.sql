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
    confidence_interval_low numeric,
    confidence_interval_high numeric,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable row level security
ALTER TABLE models.simulation_outputs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.simulation_outputs
    FOR SELECT USING (true);

-- Create index for time series queries
CREATE INDEX simulation_outputs_time_idx ON models.simulation_outputs (time_point);

COMMENT ON TABLE models.simulation_outputs IS 'Results from model simulations including projected outcomes over time';
COMMENT ON COLUMN models.simulation_outputs.run_name IS 'Name/identifier for the simulation run';
COMMENT ON COLUMN models.simulation_outputs.value IS 'Projected value of the outcome variable at the given time point';
COMMENT ON COLUMN models.simulation_outputs.metadata IS 'Additional metadata about the simulation output'; 