-- Create tables for data imports and processing
CREATE TABLE IF NOT EXISTS personal.data_imports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_type text NOT NULL CHECK (file_type IN ('spreadsheet', 'pdf', 'image', 'receipt', 'json', 'xml', 'text')),
    mime_type text NOT NULL,
    file_size integer NOT NULL,
    storage_path text NOT NULL, -- Path in storage bucket
    preview_path text, -- Path to generated preview/thumbnail
    ocr_text text, -- Extracted text content
    original_hash text NOT NULL, -- For deduplication and integrity
    import_type text NOT NULL CHECK (import_type IN ('measurements', 'conditions', 'medications', 'lab_results', 'receipts', 'mixed')),
    processing_status text NOT NULL DEFAULT 'pending' 
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'needs_review')),
    processing_error text,
    processing_metadata jsonb, -- Store AI processing details, confidence scores, etc.
    processed_at timestamptz,
    review_status text CHECK (review_status IN ('pending', 'approved', 'rejected', 'modified')),
    reviewed_by uuid REFERENCES core.profiles(id) ON DELETE SET NULL,
    review_notes text,
    retention_required boolean DEFAULT false, -- Flag for compliance/legal holds
    retention_until timestamptz, -- Optional retention end date
    access_level text DEFAULT 'private' CHECK (access_level IN ('private', 'shared', 'public')),
    shared_with jsonb, -- Array of user_ids or group_ids with access
    tags text[], -- Flexible tagging for organization
    document_date timestamptz, -- When the document was originally created/issued
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz -- Soft delete support
);

-- Add indexes for common queries
CREATE INDEX idx_data_imports_user_id ON personal.data_imports(user_id);
CREATE INDEX idx_data_imports_file_type ON personal.data_imports(file_type);
CREATE INDEX idx_data_imports_import_type ON personal.data_imports(import_type);
CREATE INDEX idx_data_imports_processing_status ON personal.data_imports(processing_status);
CREATE INDEX idx_data_imports_tags ON personal.data_imports USING gin(tags);
CREATE INDEX idx_data_imports_document_date ON personal.data_imports(document_date);
CREATE INDEX idx_data_imports_deleted_at ON personal.data_imports(deleted_at);

-- Add RLS policies
ALTER TABLE personal.data_imports ENABLE ROW LEVEL SECURITY;

-- Users can view their own imports and shared/public imports
CREATE POLICY "Users can view accessible imports"
    ON personal.data_imports FOR SELECT
    USING (
        deleted_at IS NULL AND (
            auth.uid() = user_id 
            OR access_level = 'public'
            OR (
                access_level = 'shared' 
                AND (
                    shared_with->>'user_ids' ? auth.uid()::text
                    OR EXISTS (
                        SELECT 1 FROM core.user_groups ug
                        WHERE ug.user_id = auth.uid()
                        AND shared_with->>'group_ids' ? ug.group_id::text
                    )
                )
            )
        )
    );

-- Users can create their own imports
CREATE POLICY "Users can create their own imports"
    ON personal.data_imports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own imports
CREATE POLICY "Users can update their own imports"
    ON personal.data_imports FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can soft delete their own imports
CREATE POLICY "Users can soft delete their own imports"
    ON personal.data_imports FOR UPDATE
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id AND deleted_at IS NOT NULL); 