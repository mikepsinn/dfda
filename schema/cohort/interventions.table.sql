-- Table: cohort.interventions

CREATE TABLE cohort.interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    arm_id UUID NOT NULL REFERENCES cohort.trial_arms(id) ON DELETE CASCADE,
    variable_id bigint NOT NULL REFERENCES reference.variables(id) ON DELETE CASCADE,
    dosage DECIMAL,
    unit_id bigint REFERENCES reference.units_of_measurement(id) ON DELETE RESTRICT,
    frequency TEXT,
    duration TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
