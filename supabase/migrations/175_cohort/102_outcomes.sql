-- =============================================
-- TRIALS SCHEMA - Outcomes Tracking
-- =============================================

-- Trial Outcomes
CREATE TABLE trials.outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES trials.protocols(id) ON DELETE CASCADE,
    variable_id UUID NOT NULL REFERENCES medical_ref.global_variables(id) ON DELETE CASCADE,
    outcome_type TEXT CHECK (outcome_type IN ('primary', 'secondary', 'exploratory')),
    measurement_schedule TEXT,
    target_difference DECIMAL,
    statistical_power DECIMAL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trial Data Points
CREATE TABLE trials.data_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES trials.participants(id) ON DELETE CASCADE,
    outcome_id UUID NOT NULL REFERENCES trials.outcomes(id) ON DELETE CASCADE,
    value DECIMAL,
    unit_id UUID REFERENCES medical_ref.units_of_measurement(id) ON DELETE RESTRICT,
    collection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_baseline BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trials.outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials.data_points ENABLE ROW LEVEL SECURITY;

-- Outcomes Policies
CREATE POLICY "Outcomes are viewable with protocol"
    ON trials.outcomes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM trials.protocols p 
        WHERE p.id = protocol_id 
        AND (p.status IN ('active', 'completed') OR p.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage outcomes"
    ON trials.outcomes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM trials.protocols p 
        WHERE p.id = protocol_id 
        AND p.created_by = auth.uid()
    ));

-- Data Points Policies
CREATE POLICY "Participants can view their own data"
    ON trials.data_points FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM trials.participants p 
        WHERE p.id = participant_id 
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "Trial creators can view all data points"
    ON trials.data_points FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM trials.participants p
        JOIN trials.protocols pr ON pr.id = p.protocol_id
        WHERE p.id = participant_id 
        AND pr.created_by = auth.uid()
    ));

CREATE POLICY "Trial creators can manage data points"
    ON trials.data_points FOR ALL
    USING (EXISTS (
        SELECT 1 FROM trials.participants p
        JOIN trials.protocols pr ON pr.id = p.protocol_id
        WHERE p.id = participant_id 
        AND pr.created_by = auth.uid()
    )); 