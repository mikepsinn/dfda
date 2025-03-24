-- Table: cohort.trials_participants

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
