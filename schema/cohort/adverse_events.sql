-- Trial Adverse Events
CREATE TABLE cohort.adverse_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES cohort.trial_participants(id) ON DELETE CASCADE,
    variable_id UUID NOT NULL REFERENCES reference.variables(id) ON DELETE CASCADE,
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
ALTER TABLE cohort.adverse_events ENABLE ROW LEVEL SECURITY;

-- Adverse Events Policies
CREATE POLICY "Participants can view their own adverse events"
    ON cohort.adverse_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.trial_participants p 
        WHERE p.id = participant_id 
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "Trial creators can view all adverse events"
    ON cohort.adverse_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.trial_participants p
        JOIN cohort.protocols pr ON pr.id = p.protocol_id
        WHERE p.id = participant_id 
        AND pr.created_by = auth.uid()
    ));

CREATE POLICY "Trial creators can manage adverse events"
    ON cohort.adverse_events FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.trial_participants p
        JOIN cohort.protocols pr ON pr.id = p.protocol_id
        WHERE p.id = participant_id 
        AND pr.created_by = auth.uid()
    )); 