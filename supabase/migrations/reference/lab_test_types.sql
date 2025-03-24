-- Lab Test Types
--
-- Standard laboratory test definitions and reference ranges
-- Used to validate and interpret lab results
--
CREATE TABLE reference.lab_test_types (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    variable_id bigint REFERENCES reference.variables(id),
    loinc_code text UNIQUE,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
); 