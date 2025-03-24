-- Population segments table for defining cohorts and demographic groups
CREATE TABLE reference.population_segments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    age_min numeric,
    age_max numeric,
    condition_variable_id bigint REFERENCES reference.global_variables(id),
    demographic_filters jsonb,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable row level security
ALTER TABLE reference.population_segments ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON reference.population_segments
    FOR SELECT USING (true);

COMMENT ON TABLE reference.population_segments IS 'Defines population segments for modeling (e.g., age groups, conditions, demographics)';
COMMENT ON COLUMN reference.population_segments.condition_variable_id IS 'Reference to condition/disease variable if segment is condition-specific';
COMMENT ON COLUMN reference.population_segments.demographic_filters IS 'JSON filters for demographic criteria';
COMMENT ON COLUMN reference.population_segments.metadata IS 'Additional segment metadata and criteria'; 