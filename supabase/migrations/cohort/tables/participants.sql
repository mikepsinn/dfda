-- Trial Participants
CREATE TABLE cohort.participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES cohort.protocols(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    arm_id UUID REFERENCES cohort.arms(id) ON DELETE SET NULL,
    enrollment_date DATE NOT NULL,
    withdrawal_date DATE,
    withdrawal_reason TEXT,
    status TEXT CHECK (status IN ('screening', 'enrolled', 'active', 'completed', 'withdrawn', 'excluded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(protocol_id, user_id)
);

-- Enable RLS
ALTER TABLE cohort.participants ENABLE ROW LEVEL SECURITY;

-- Participants Policies
CREATE POLICY "Participants can view their own enrollment"
    ON cohort.participants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Trial creators can view all participants"
    ON cohort.participants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.protocols p 
        WHERE p.id = protocol_id 
        AND p.created_by = auth.uid()
    ));

CREATE POLICY "Trial creators can manage participants"
    ON cohort.participants FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.protocols p 
        WHERE p.id = protocol_id 
        AND p.created_by = auth.uid()
    )); 