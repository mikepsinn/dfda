-- Trial Interventions
CREATE TABLE cohort.interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    arm_id UUID NOT NULL REFERENCES cohort.arms(id) ON DELETE CASCADE,
    variable_id UUID NOT NULL REFERENCES medical_ref.global_variables(id) ON DELETE CASCADE,
    dosage DECIMAL,
    unit_id UUID REFERENCES medical_ref.units_of_measurement(id) ON DELETE RESTRICT,
    frequency TEXT,
    duration TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cohort.interventions ENABLE ROW LEVEL SECURITY;

-- Interventions Policies
CREATE POLICY "Interventions are viewable with protocol"
    ON cohort.interventions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.arms a
        JOIN cohort.protocols p ON p.id = a.protocol_id
        WHERE a.id = arm_id 
        AND (p.status IN ('active', 'completed') OR p.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage interventions"
    ON cohort.interventions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.arms a
        JOIN cohort.protocols p ON p.id = a.protocol_id
        WHERE a.id = arm_id 
        AND p.created_by = auth.uid()
    )); 