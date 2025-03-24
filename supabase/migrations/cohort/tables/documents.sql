-- Trial Documents
CREATE TABLE cohort.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES cohort.protocols(id) ON DELETE CASCADE,
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

-- Enable RLS
ALTER TABLE cohort.documents ENABLE ROW LEVEL SECURITY;

-- Documents Policies
CREATE POLICY "Documents are viewable with protocol"
    ON cohort.documents FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.protocols p 
        WHERE p.id = protocol_id 
        AND (p.status IN ('active', 'completed') OR p.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage documents"
    ON cohort.documents FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.protocols p 
        WHERE p.id = protocol_id 
        AND p.created_by = auth.uid()
    )); 