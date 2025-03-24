-- Parameter sets table for storing named assumption sets
CREATE TABLE models.parameter_sets (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    parameters jsonb NOT NULL,
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

COMMENT ON TABLE models.parameter_sets IS 'Named sets of model parameters and assumptions';
COMMENT ON COLUMN models.parameter_sets.parameters IS 'JSON object containing parameter values';
COMMENT ON COLUMN models.parameter_sets.is_baseline IS 'Whether this is a baseline scenario';
COMMENT ON COLUMN models.parameter_sets.metadata IS 'Additional metadata about the parameter set'; 