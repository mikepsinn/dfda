-- Population demographics table for storing demographic distributions
CREATE TABLE models.population_demographics (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    population_segment_id bigint NOT NULL REFERENCES reference.population_segments(id),
    parameter_set_id bigint NOT NULL REFERENCES models.parameter_sets(id),
    age_group text NOT NULL,
    percentage numeric NOT NULL CHECK (percentage BETWEEN 0 AND 100),
    risk_multiplier numeric NOT NULL DEFAULT 1.0,
    population_count bigint,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable row level security
ALTER TABLE models.population_demographics ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.population_demographics
    FOR SELECT USING (true);

COMMENT ON TABLE models.population_demographics IS 'Demographic distributions and risk multipliers for population segments';
COMMENT ON COLUMN models.population_demographics.age_group IS 'Age group category (e.g., Under 45, 45-64, etc.)';
COMMENT ON COLUMN models.population_demographics.percentage IS 'Percentage of population in this demographic group';
COMMENT ON COLUMN models.population_demographics.risk_multiplier IS 'Risk multiplier for this demographic group';
COMMENT ON COLUMN models.population_demographics.population_count IS 'Absolute count of population in this demographic group'; 