-- Cohort Schema
-- Contains aggregated data for specific patient groups/cohorts
CREATE SCHEMA cohort; 

-- =============================================
-- TRIALS SCHEMA - Core Trial Tables
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

-- Enable RLS
ALTER TABLE trials.protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials.arms ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials.interventions ENABLE ROW LEVEL SECURITY;

-- Protocols Policies
CREATE POLICY "Public protocols are viewable by all"
    ON trials.protocols FOR SELECT
    USING (status IN ('active', 'completed'));

CREATE POLICY "Trial creators can manage their protocols"
    ON trials.protocols FOR ALL
    USING (auth.uid() = created_by);

-- Arms Policies
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

-- Interventions Policies
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