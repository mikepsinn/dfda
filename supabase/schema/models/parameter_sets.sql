-- Parameter sets table for storing named assumption sets
CREATE TABLE models.parameter_sets (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    parameters jsonb NOT NULL,
    scenario_type text NOT NULL CHECK (scenario_type IN ('base', 'best', 'worst')),
    -- Time value parameters
    time_horizon_years integer NOT NULL,
    discount_rate numeric NOT NULL,
    inflation_rate numeric,
    present_value_factor numeric NOT NULL,
    metadata jsonb,
    is_baseline boolean DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable row level security
ALTER TABLE models.parameter_sets ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.parameter_sets
    FOR SELECT USING (true);

COMMENT ON TABLE models.parameter_sets IS 'Named sets of model parameters, assumptions, and time value parameters';
COMMENT ON COLUMN models.parameter_sets.parameters IS 'JSON object containing parameter values';
COMMENT ON COLUMN models.parameter_sets.scenario_type IS 'Whether this is a base, best, or worst case scenario';
COMMENT ON COLUMN models.parameter_sets.time_horizon_years IS 'Time horizon for projections in years';
COMMENT ON COLUMN models.parameter_sets.discount_rate IS 'Annual discount rate for future value calculations';
COMMENT ON COLUMN models.parameter_sets.present_value_factor IS 'Calculated present value factor for the time horizon';
COMMENT ON COLUMN models.parameter_sets.is_baseline IS 'Whether this is a baseline scenario';
COMMENT ON COLUMN models.parameter_sets.metadata IS 'Additional metadata about the parameter set'; 