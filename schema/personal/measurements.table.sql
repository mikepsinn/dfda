-- Table: personal.measurements

CREATE TABLE personal.measurements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    variable_id bigint NOT NULL REFERENCES reference.variables(id),
    value numeric NOT NULL,
    unit_id VARCHAR(50) REFERENCES reference.units_of_measurement(id),
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
