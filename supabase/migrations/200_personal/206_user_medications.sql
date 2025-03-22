-- User Medications
--
-- User-specific medication records and prescriptions
-- Links to standard medication variables in the reference schema
--
CREATE TABLE personal.user_medications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    medication_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    dosage numeric,
    unit_id bigint REFERENCES reference.units_of_measurement(id),
    frequency text,
    route_of_administration text,
    start_at timestamptz NOT NULL,
    end_at timestamptz,
    prescriber text,
    pharmacy text,
    prescription_number text,
    notes text,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, medication_variable_id, start_at)
);

-- Enable RLS
ALTER TABLE personal.user_medications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own medications"
    ON personal.user_medications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own medications"
    ON personal.user_medications FOR ALL
    USING (auth.uid() = user_id); 