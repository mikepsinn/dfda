-- Trial Protocols
CREATE TABLE cohort.protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT,
    study_type TEXT NOT NULL,
    phase TEXT CHECK (phase IN ('0', '1', '2', '3', '4', 'n/a')),
    status TEXT CHECK (status IN ('draft', 'pending_review', 'approved', 'active', 'completed', 'terminated', 'withdrawn')),
    start_date DATE,
    end_date DATE,
    target_participants INTEGER,
    inclusion_criteria TEXT[],
    exclusion_criteria TEXT[],
    created_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cohort.protocols ENABLE ROW LEVEL SECURITY;

-- Protocols Policies
CREATE POLICY "Public protocols are viewable by all"
    ON cohort.protocols FOR SELECT
    USING (status IN ('active', 'completed'));

CREATE POLICY "Trial creators can manage their protocols"
    ON cohort.protocols FOR ALL
    USING (auth.uid() = created_by); 