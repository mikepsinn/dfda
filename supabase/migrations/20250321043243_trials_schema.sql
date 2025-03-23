-- =============================================
-- TRIALS SCHEMA - Clinical Trials Data
-- =============================================

-- Trial Protocols
CREATE TABLE trials.protocols (
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

-- Trial Arms
CREATE TABLE trials.arms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES trials.protocols(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    arm_type TEXT CHECK (arm_type IN ('control', 'experimental', 'placebo')),
    target_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(protocol_id, name)
);

-- Trial Interventions
CREATE TABLE trials.interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    arm_id UUID NOT NULL REFERENCES trials.arms(id) ON DELETE CASCADE,
    variable_id UUID NOT NULL REFERENCES medical_ref.global_variables(id) ON DELETE CASCADE,
    dosage DECIMAL,
    unit_id UUID REFERENCES medical_ref.units_of_measurement(id) ON DELETE RESTRICT,
    frequency TEXT,
    duration TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Trial Documents
CREATE TABLE trials.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES trials.protocols(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    version TEXT,
    is_current_version BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE trials.protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials.arms ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials.outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials.data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials.adverse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials.documents ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Protocols
CREATE POLICY "Public protocols are viewable by all"
    ON trials.protocols FOR SELECT
    USING (status IN ('active', 'completed'));

CREATE POLICY "Trial creators can manage their protocols"
    ON trials.protocols FOR ALL
    USING (auth.uid() = created_by);

-- Arms
CREATE POLICY "Arms are viewable with protocol"
    ON trials.arms FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM trials.protocols p 
        WHERE p.id = protocol_id 
        AND (p.status IN ('active', 'completed') OR p.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage arms"
    ON trials.arms FOR ALL
    USING (EXISTS (
        SELECT 1 FROM trials.protocols p 
        WHERE p.id = protocol_id 
        AND p.created_by = auth.uid()
    ));

-- Interventions
CREATE POLICY "Interventions are viewable with protocol"
    ON trials.interventions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM trials.arms a
        JOIN trials.protocols p ON p.id = a.protocol_id
        WHERE a.id = arm_id 
        AND (p.status IN ('active', 'completed') OR p.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage interventions"
    ON trials.interventions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM trials.arms a
        JOIN trials.protocols p ON p.id = a.protocol_id
        WHERE a.id = arm_id 
        AND p.created_by = auth.uid()
    ));

-- Outcomes
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

-- Participants
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

-- Data Points
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

-- Adverse Events
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

-- Documents
CREATE POLICY "Documents are viewable with protocol"
    ON trials.documents FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM trials.protocols p 
        WHERE p.id = protocol_id 
        AND (p.status IN ('active', 'completed') OR p.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage documents"
    ON trials.documents FOR ALL
    USING (EXISTS (
        SELECT 1 FROM trials.protocols p 
        WHERE p.id = protocol_id 
        AND p.created_by = auth.uid()
    )); 