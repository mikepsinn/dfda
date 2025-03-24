-- Trial Arms
CREATE TABLE cohort.arms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES cohort.protocols(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    arm_type TEXT CHECK (arm_type IN ('control', 'experimental', 'placebo')),
    target_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(protocol_id, name)
);

-- Enable RLS
ALTER TABLE cohort.arms ENABLE ROW LEVEL SECURITY;

-- Arms Policies
CREATE POLICY "Arms are viewable with protocol"
    ON cohort.arms FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.protocols p 
        WHERE p.id = protocol_id 
        AND (p.status IN ('active', 'completed') OR p.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage arms"
    ON cohort.arms FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.protocols p 
        WHERE p.id = protocol_id 
        AND p.created_by = auth.uid()
    )); 