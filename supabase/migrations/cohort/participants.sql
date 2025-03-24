-- =============================================
-- TRIALS SCHEMA - Participant Management
-- =============================================

-- Trial Participants
CREATE TABLE trials.participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES trials.protocols(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    arm_id UUID REFERENCES trials.arms(id) ON DELETE SET NULL,
    enrollment_date DATE NOT NULL,
    withdrawal_date DATE,
    withdrawal_reason TEXT,
    status TEXT CHECK (status IN ('screening', 'enrolled', 'active', 'completed', 'withdrawn', 'excluded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(protocol_id, user_id)
);

-- Trial Adverse Events
CREATE TABLE trials.adverse_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES trials.participants(id) ON DELETE CASCADE,
    variable_id UUID NOT NULL REFERENCES medical_ref.global_variables(id) ON DELETE CASCADE,
    onset_date TIMESTAMP WITH TIME ZONE NOT NULL,
    resolution_date TIMESTAMP WITH TIME ZONE,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening', 'death')),
    relatedness TEXT CHECK (relatedness IN ('unrelated', 'unlikely', 'possible', 'probable', 'definite')),
    is_serious BOOLEAN DEFAULT FALSE,
    action_taken TEXT,
    outcome TEXT,
    notes TEXT,
    reported_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trials.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials.adverse_events ENABLE ROW LEVEL SECURITY;

-- Participants Policies
CREATE POLICY "Participants can view their own enrollment"
    ON trials.participants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Trial creators can view all participants"
    ON trials.participants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM trials.protocols p 
        WHERE p.id = protocol_id 
        AND p.created_by = auth.uid()
    ));

CREATE POLICY "Trial creators can manage participants"
    ON trials.participants FOR ALL
    USING (EXISTS (
        SELECT 1 FROM trials.protocols p 
        WHERE p.id = protocol_id 
        AND p.created_by = auth.uid()
    ));

-- Adverse Events Policies
CREATE POLICY "Participants can view their own adverse events"
    ON trials.adverse_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM trials.participants p 
        WHERE p.id = participant_id 
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "Trial creators can view all adverse events"
    ON trials.adverse_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM trials.participants p
        JOIN trials.protocols pr ON pr.id = p.protocol_id
        WHERE p.id = participant_id 
        AND pr.created_by = auth.uid()
    ));

CREATE POLICY "Trial creators can manage adverse events"
    ON trials.adverse_events FOR ALL
    USING (EXISTS (
        SELECT 1 FROM trials.participants p
        JOIN trials.protocols pr ON pr.id = p.protocol_id
        WHERE p.id = participant_id 
        AND pr.created_by = auth.uid()
    )); 