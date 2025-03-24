-- =============================================
-- TRIALS SCHEMA - Document Management
-- =============================================

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

-- Enable RLS
ALTER TABLE trials.documents ENABLE ROW LEVEL SECURITY;

-- Documents Policies
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