-- Trial Participants
CREATE TABLE cohort.trials_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trial_id UUID NOT NULL REFERENCES cohort.trials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    trial_arm_id UUID REFERENCES cohort.trial_arms(id) ON DELETE SET NULL,
    enrollment_date DATE NOT NULL,
    withdrawal_date DATE,
    withdrawal_reason TEXT,
    status TEXT CHECK (status IN ('screening', 'enrolled', 'active', 'completed', 'withdrawn', 'excluded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trial_id, user_id)
);

-- Enable RLS
ALTER TABLE cohort.trials_participants ENABLE ROW LEVEL SECURITY;

-- Participants Policies
CREATE POLICY "Participants can view their own enrollment"
    ON cohort.trials_participants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Trial creators can view all participants"
    ON cohort.trials_participants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.trials t 
        WHERE t.id = trial_id 
        AND t.created_by = auth.uid()
    ));

CREATE POLICY "Trial creators can manage participants"
    ON cohort.trials_participants FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.trials t 
        WHERE t.id = trial_id 
        AND t.created_by = auth.uid()
    )); 