-- Table: cohort.outcomes

CREATE TABLE cohort.outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES cohort.protocols(id) ON DELETE CASCADE,
    variable_id bigint NOT NULL REFERENCES reference.variables(id) ON DELETE CASCADE,
    outcome_type TEXT CHECK (outcome_type IN ('primary', 'secondary', 'exploratory')),
    measurement_schedule TEXT,
    target_difference DECIMAL,
    statistical_power DECIMAL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
