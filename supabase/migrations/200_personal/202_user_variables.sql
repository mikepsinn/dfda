-- User Variables
--
-- User-specific variable settings and preferences
-- Links to global variables but contains user-specific configurations
--
CREATE TABLE personal.user_variables (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    display_name text,
    description text,
    unit_id bigint REFERENCES reference.units_of_measurement(id),
    default_value numeric,
    minimum_value numeric,
    maximum_value numeric,
    filling_type text CHECK (filling_type IN ('zero', 'carry_forward', 'interpolate')),
    joining_type text CHECK (joining_type IN ('sum', 'mean', 'median', 'min', 'max')),
    onset_delay interval,
    duration_of_action interval,
    measurement_source text,
    measurement_method text,
    last_processed_at timestamptz,
    analysis_settings jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, variable_id)
);

-- Enable RLS
ALTER TABLE personal.user_variables ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own variables"
    ON personal.user_variables FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own variables"
    ON personal.user_variables FOR ALL
    USING (auth.uid() = user_id); 