-- Trial Outcomes
CREATE TABLE cohort.outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES cohort.protocols(id) ON DELETE CASCADE,
    variable_id UUID NOT NULL REFERENCES medical_ref.variables(id) ON DELETE CASCADE,
    outcome_type TEXT CHECK (outcome_type IN ('primary', 'secondary', 'exploratory')),
    measurement_schedule TEXT,
    target_difference DECIMAL,
    statistical_power DECIMAL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cohort.outcomes ENABLE ROW LEVEL SECURITY;

-- Outcomes Policies
CREATE POLICY "Outcomes are viewable with protocol"
    ON cohort.outcomes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.protocols p 
        WHERE p.id = protocol_id 
        AND (p.status IN ('active', 'completed') OR p.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage outcomes"
    ON cohort.outcomes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.protocols p 
        WHERE p.id = protocol_id 
        AND p.created_by = auth.uid()
    )); 