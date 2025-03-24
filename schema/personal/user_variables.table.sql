-- Table: personal.user_variables

CREATE TABLE personal.user_variables (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    variable_id bigint NOT NULL REFERENCES reference.variables(id),
    display_name text,
    description text,
    unit_id VARCHAR(50) REFERENCES reference.units_of_measurement(id),
    default_value numeric,
    minimum_value numeric,
    maximum_value numeric,
    filling_type filling_type_enum DEFAULT 'none',
    joining_type combination_operation_enum DEFAULT 'mean',
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
