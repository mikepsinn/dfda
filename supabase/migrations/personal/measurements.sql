-- Measurements Table
--
-- Stores individual measurements/data points for user variables
-- This is the base table that user and global statistics are calculated from
--
CREATE TABLE personal.measurements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    variable_id bigint NOT NULL REFERENCES reference.variables(id),
    value numeric NOT NULL,
    unit_id bigint REFERENCES reference.units_of_measurement(id),
    source_type text NOT NULL CHECK (source_type IN ('manual', 'import', 'api', 'device', 'calculation')),
    source_id text,                    -- External identifier for imported/API data
    timestamp timestamptz NOT NULL,    -- When the measurement was taken
    timezone text,                     -- User's timezone when measurement was taken
    location point,                    -- Optional location data
    notes text,                        -- Any additional notes
    metadata jsonb,                    -- Flexible metadata storage
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_measurements_user_variable 
ON personal.measurements(user_id, variable_id);

CREATE INDEX idx_measurements_timestamp 
ON personal.measurements(timestamp);

CREATE INDEX idx_measurements_source 
ON personal.measurements(source_type, source_id);

-- Enable RLS
ALTER TABLE personal.measurements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own measurements"
    ON personal.measurements FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own measurements"
    ON personal.measurements FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own measurements"
    ON personal.measurements FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own measurements"
    ON personal.measurements FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

COMMENT ON TABLE personal.measurements IS 'Stores individual measurements/data points for user variables';
COMMENT ON COLUMN personal.measurements.value IS 'The actual measurement value';
COMMENT ON COLUMN personal.measurements.source_type IS 'How the measurement was recorded (manual, import, api, device, calculation)';
COMMENT ON COLUMN personal.measurements.source_id IS 'External identifier for imported or API data';
COMMENT ON COLUMN personal.measurements.timestamp IS 'When the measurement was taken';
COMMENT ON COLUMN personal.measurements.timezone IS 'User''s timezone when measurement was taken';
COMMENT ON COLUMN personal.measurements.metadata IS 'Flexible storage for additional measurement metadata'; 