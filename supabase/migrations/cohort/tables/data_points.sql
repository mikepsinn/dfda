-- Trial Data Points
CREATE TABLE cohort.data_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES cohort.participants(id) ON DELETE CASCADE,
    outcome_id UUID NOT NULL REFERENCES cohort.outcomes(id) ON DELETE CASCADE,
    value DECIMAL,
    unit_id UUID REFERENCES medical_ref.units_of_measurement(id) ON DELETE RESTRICT,
    collection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_baseline BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cohort.data_points ENABLE ROW LEVEL SECURITY;

-- Data Points Policies
CREATE POLICY "Participants can view their own data"
    ON cohort.data_points FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.participants p 
        WHERE p.id = participant_id 
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "Trial creators can view all data points"
    ON cohort.data_points FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.participants p
        JOIN cohort.protocols pr ON pr.id = p.protocol_id
        WHERE p.id = participant_id 
        AND pr.created_by = auth.uid()
    ));

CREATE POLICY "Trial creators can manage data points"
    ON cohort.data_points FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.participants p
        JOIN cohort.protocols pr ON pr.id = p.protocol_id
        WHERE p.id = participant_id 
        AND pr.created_by = auth.uid()
    )); 