-- Table: cohort.adverse_events

CREATE TABLE cohort.adverse_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES cohort.trial_participants(id) ON DELETE CASCADE,
    variable_id bigint NOT NULL REFERENCES reference.variables(id) ON DELETE CASCADE,
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
