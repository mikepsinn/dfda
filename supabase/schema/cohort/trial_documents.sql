-- Trial Documents
CREATE TABLE cohort.trial_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trial_id UUID NOT NULL REFERENCES cohort.trials(id) ON DELETE CASCADE,
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
ALTER TABLE cohort.trial_documents ENABLE ROW LEVEL SECURITY;

-- Documents Policies
CREATE POLICY "Documents are viewable with trial"
    ON cohort.trial_documents FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.trials t 
        WHERE t.id = trial_id 
        AND (t.status IN ('active', 'completed') OR t.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage documents"
    ON cohort.trial_documents FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.trials t 
        WHERE t.id = trial_id 
        AND t.created_by = auth.uid()
    )); 