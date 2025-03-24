-- Global variables table storing standardized variable definitions
CREATE TABLE reference.variables (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category_id bigint NOT NULL REFERENCES reference.variable_categories(id),
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    unit_id bigint REFERENCES reference.units_of_measurement(id),
    data_type text NOT NULL CHECK (data_type IN ('numeric', 'categorical', 'boolean', 'text')),
    default_value text,
    minimum_value numeric,
    maximum_value numeric,
    allowed_values text[],
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable row level security
ALTER TABLE reference.variables ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON reference.variables
    FOR SELECT USING (true);

COMMENT ON TABLE reference.variables IS 'Standardized global variable definitions that serve as templates for user and cohort variables';
COMMENT ON COLUMN reference.variables.name IS 'Unique identifier name for the variable';
COMMENT ON COLUMN reference.variables.display_name IS 'Human-readable name for display';
COMMENT ON COLUMN reference.variables.data_type IS 'Type of data this variable stores (numeric, categorical, boolean, text)';
COMMENT ON COLUMN reference.variables.allowed_values IS 'Array of allowed values for categorical variables'; 