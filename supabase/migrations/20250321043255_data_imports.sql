-- Create tables for data imports and processing
CREATE TABLE IF NOT EXISTS medical.data_imports (
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
CREATE INDEX idx_data_imports_user_id ON medical.data_imports(user_id);
CREATE INDEX idx_data_imports_file_type ON medical.data_imports(file_type);
CREATE INDEX idx_data_imports_import_type ON medical.data_imports(import_type);
CREATE INDEX idx_data_imports_processing_status ON medical.data_imports(processing_status);
CREATE INDEX idx_data_imports_tags ON medical.data_imports USING gin(tags);
CREATE INDEX idx_data_imports_document_date ON medical.data_imports(document_date);
CREATE INDEX idx_data_imports_deleted_at ON medical.data_imports(deleted_at);

-- Table to store extracted data points before they're verified and imported
CREATE TABLE IF NOT EXISTS medical.extracted_data_points (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_id uuid NOT NULL REFERENCES medical.data_imports(id) ON DELETE CASCADE,
    data_type text NOT NULL CHECK (data_type IN ('measurement', 'condition', 'medication', 'lab_result', 'receipt')),
    variable_id uuid REFERENCES medical_ref.global_variables(id) ON DELETE CASCADE,
    extracted_value text NOT NULL,
    parsed_value decimal,
    unit_id uuid REFERENCES medical_ref.units_of_measurement(id) ON DELETE RESTRICT,
    timestamp timestamptz,
    confidence_score decimal CHECK (confidence_score BETWEEN 0 AND 1),
    requires_review boolean DEFAULT false,
    review_status text DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'modified')),
    reviewed_by uuid REFERENCES core.profiles(id) ON DELETE SET NULL,
    review_notes text,
    source_coordinates jsonb, -- Store location in original file (e.g., cell coordinates, PDF coordinates)
    metadata jsonb, -- Additional extracted context
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create view for import status and statistics
CREATE OR REPLACE VIEW medical.import_statistics AS
SELECT 
    di.id as import_id,
    di.user_id,
    di.file_name,
    di.file_type,
    di.import_type,
    di.processing_status,
    di.processed_at,
    di.retention_required,
    di.retention_until,
    di.access_level,
    di.document_date,
    COUNT(edp.id) as total_data_points,
    COUNT(edp.id) FILTER (WHERE edp.confidence_score >= 0.9) as high_confidence_points,
    COUNT(edp.id) FILTER (WHERE edp.requires_review) as points_requiring_review,
    COUNT(edp.id) FILTER (WHERE edp.review_status = 'approved') as approved_points,
    COUNT(edp.id) FILTER (WHERE edp.review_status = 'rejected') as rejected_points,
    MIN(edp.confidence_score) as min_confidence,
    AVG(edp.confidence_score) as avg_confidence,
    MAX(edp.confidence_score) as max_confidence,
    array_length(di.tags, 1) as tag_count
FROM medical.data_imports di
LEFT JOIN medical.extracted_data_points edp ON di.id = edp.import_id
WHERE di.deleted_at IS NULL
GROUP BY di.id, di.user_id, di.file_name, di.file_type, di.import_type, 
         di.processing_status, di.processed_at, di.retention_required, 
         di.retention_until, di.access_level, di.document_date, di.tags;

-- Add RLS policies
ALTER TABLE medical.data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical.extracted_data_points ENABLE ROW LEVEL SECURITY;

-- Users can view their own imports and shared/public imports
CREATE POLICY "Users can view accessible imports"
    ON medical.data_imports FOR SELECT
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
    ON medical.data_imports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own imports
CREATE POLICY "Users can update their own imports"
    ON medical.data_imports FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can soft delete their own imports
CREATE POLICY "Users can soft delete their own imports"
    ON medical.data_imports FOR UPDATE
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id AND deleted_at IS NOT NULL);

-- Users can view extracted data from accessible imports
CREATE POLICY "Users can view extracted data from accessible imports"
    ON medical.extracted_data_points FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM medical.data_imports di
        WHERE di.id = import_id 
        AND di.deleted_at IS NULL
        AND (
            di.user_id = auth.uid() 
            OR di.access_level = 'public'
            OR (
                di.access_level = 'shared' 
                AND (
                    di.shared_with->>'user_ids' ? auth.uid()::text
                    OR EXISTS (
                        SELECT 1 FROM core.user_groups ug
                        WHERE ug.user_id = auth.uid()
                        AND di.shared_with->>'group_ids' ? ug.group_id::text
                    )
                )
            )
        )
    ));

-- Add data sources table
CREATE TABLE IF NOT EXISTS medical.data_sources (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type text NOT NULL CHECK (source_type IN (
        'data_import',      -- File uploads and documents
        'oauth_client',     -- OAuth2 client applications
        'integration',      -- Third-party API integrations
        'manual_entry',     -- Direct user input
        'device',          -- Connected devices/sensors
        'calculated'       -- Derived/calculated from other measurements
    )),
    -- Source-specific identifiers (only one should be set based on source_type)
    import_id uuid REFERENCES medical.data_imports(id) ON DELETE SET NULL,
    client_id uuid REFERENCES oauth2.clients(id) ON DELETE SET NULL,
    integration_id text, -- External integration identifier
    device_id text,     -- Device identifier
    -- Common metadata
    name text NOT NULL,  -- Display name of the source
    description text,    -- Optional description
    metadata jsonb,      -- Additional source-specific metadata
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Ensure only one identifier is set based on source_type
    CONSTRAINT valid_source_reference CHECK (
        CASE source_type
            WHEN 'data_import' THEN (import_id IS NOT NULL AND client_id IS NULL AND integration_id IS NULL AND device_id IS NULL)
            WHEN 'oauth_client' THEN (import_id IS NULL AND client_id IS NOT NULL AND integration_id IS NULL AND device_id IS NULL)
            WHEN 'integration' THEN (import_id IS NULL AND client_id IS NULL AND integration_id IS NOT NULL AND device_id IS NULL)
            WHEN 'device' THEN (import_id IS NULL AND client_id IS NULL AND integration_id IS NULL AND device_id IS NOT NULL)
            ELSE (import_id IS NULL AND client_id IS NULL AND integration_id IS NULL AND device_id IS NULL)
        END
    )
);

-- Add indexes for data sources
CREATE INDEX idx_data_sources_source_type ON medical.data_sources(source_type);
CREATE INDEX idx_data_sources_import_id ON medical.data_sources(import_id) WHERE import_id IS NOT NULL;
CREATE INDEX idx_data_sources_client_id ON medical.data_sources(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_data_sources_integration_id ON medical.data_sources(integration_id) WHERE integration_id IS NOT NULL;
CREATE INDEX idx_data_sources_device_id ON medical.data_sources(device_id) WHERE device_id IS NOT NULL;

-- Add RLS policy for data sources
ALTER TABLE medical.data_sources ENABLE ROW LEVEL SECURITY;

-- Users can view data sources referenced by their measurements or imports
CREATE POLICY "Users can view referenced data sources"
    ON medical.data_sources FOR SELECT
    USING (
        -- Allow if user owns related import
        EXISTS (
            SELECT 1 FROM medical.data_imports di
            WHERE di.id = import_id
            AND di.user_id = auth.uid()
        )
        OR
        -- Allow if user has measurements from this source
        EXISTS (
            SELECT 1 FROM medical.variable_measurements vm
            WHERE vm.source_id = id
            AND vm.user_id = auth.uid()
        )
        OR
        -- Allow if source is an OAuth client
        source_type = 'oauth_client'
        OR
        -- Allow if source is a public integration
        (source_type = 'integration' AND metadata->>'public' = 'true')
    );

-- Modify the process_approved_data_points function to use data sources
CREATE OR REPLACE FUNCTION medical.process_approved_data_points(
    p_import_id uuid,
    p_reviewed_by uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_processed_count integer := 0;
    v_source_id uuid;
BEGIN
    -- Get or create data source for this import
    INSERT INTO medical.data_sources (
        source_type,
        import_id,
        name,
        description,
        metadata
    )
    SELECT 
        'data_import',
        di.id,
        'Import: ' || di.file_name,
        'Data imported from ' || di.file_type || ' file',
        jsonb_build_object(
            'file_type', di.file_type,
            'mime_type', di.mime_type,
            'import_type', di.import_type
        )
    FROM medical.data_imports di
    WHERE di.id = p_import_id
    ON CONFLICT (import_id) WHERE source_type = 'data_import'
    DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_source_id;

    -- Process measurements with source_id
    INSERT INTO medical.variable_measurements (
        user_id,
        variable_id,
        value,
        unit_id,
        measurement_time,
        source,
        source_id,
        notes,
        is_estimated
    )
    SELECT 
        di.user_id,
        edp.variable_id,
        edp.parsed_value,
        edp.unit_id,
        COALESCE(edp.timestamp, di.created_at),
        'data_import',
        v_source_id,
        'Imported from ' || di.file_name || CASE 
            WHEN edp.source_coordinates IS NOT NULL 
            THEN ' at ' || edp.source_coordinates::text
            ELSE ''
        END,
        edp.confidence_score < 0.9
    FROM medical.extracted_data_points edp
    JOIN medical.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'measurement'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = ROW_COUNT;

    -- Process conditions
    INSERT INTO medical.conditions (
        user_id,
        variable_id,
        onset_date,
        status,
        diagnosis_type,
        notes
    )
    SELECT 
        di.user_id,
        edp.variable_id,
        COALESCE(edp.timestamp, di.created_at),
        'active',
        'self_reported',
        'Imported from ' || di.file_name || CASE 
            WHEN edp.source_coordinates IS NOT NULL 
            THEN ' at ' || edp.source_coordinates::text
            ELSE ''
        END
    FROM medical.extracted_data_points edp
    JOIN medical.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'condition'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = v_processed_count + ROW_COUNT;

    -- Process medications
    INSERT INTO medical.medications (
        user_id,
        variable_id,
        dosage,
        unit_id,
        start_date,
        status,
        notes
    )
    SELECT 
        di.user_id,
        edp.variable_id,
        edp.parsed_value,
        edp.unit_id,
        COALESCE(edp.timestamp, di.created_at),
        'active',
        'Imported from ' || di.file_name || CASE 
            WHEN edp.source_coordinates IS NOT NULL 
            THEN ' at ' || edp.source_coordinates::text
            ELSE ''
        END
    FROM medical.extracted_data_points edp
    JOIN medical.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'medication'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = v_processed_count + ROW_COUNT;

    -- Process lab results
    INSERT INTO medical.lab_results (
        user_id,
        lab_test_id,
        value,
        unit_id,
        test_date,
        notes
    )
    SELECT 
        di.user_id,
        edp.variable_id,
        edp.parsed_value,
        edp.unit_id,
        COALESCE(edp.timestamp, di.created_at),
        'Imported from ' || di.file_name || CASE 
            WHEN edp.source_coordinates IS NOT NULL 
            THEN ' at ' || edp.source_coordinates::text
            ELSE ''
        END
    FROM medical.extracted_data_points edp
    JOIN medical.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'lab_result'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = v_processed_count + ROW_COUNT;

    -- Update import status
    UPDATE medical.data_imports
    SET 
        processing_status = 'completed',
        processed_at = CURRENT_TIMESTAMP,
        reviewed_by = p_reviewed_by
    WHERE id = p_import_id;

    RETURN v_processed_count;
END;
$$;

-- Function to soft delete an import and its data
CREATE OR REPLACE FUNCTION medical.soft_delete_import(
    p_import_id uuid,
    p_deletion_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if retention is required
    IF EXISTS (
        SELECT 1 FROM medical.data_imports
        WHERE id = p_import_id
        AND retention_required = true
        AND (retention_until IS NULL OR retention_until > CURRENT_TIMESTAMP)
    ) THEN
        RAISE EXCEPTION 'Cannot delete import: retention required';
    END IF;

    -- Soft delete the import
    UPDATE medical.data_imports
    SET 
        deleted_at = CURRENT_TIMESTAMP,
        review_notes = CASE 
            WHEN review_notes IS NULL THEN p_deletion_note
            ELSE review_notes || E'\n' || p_deletion_note
        END
    WHERE id = p_import_id
    AND deleted_at IS NULL;
END;
$$;

-- Create a view to see measurement sources with context
CREATE OR REPLACE VIEW medical.measurement_sources AS
SELECT 
    m.id as measurement_id,
    m.user_id,
    m.variable_id,
    m.measurement_time,
    ds.source_type,
    ds.name as source_name,
    ds.description as source_description,
    CASE ds.source_type
        WHEN 'data_import' THEN jsonb_build_object(
            'file_name', di.file_name,
            'file_type', di.file_type,
            'import_type', di.import_type
        )
        WHEN 'oauth_client' THEN jsonb_build_object(
            'client_name', c.name,
            'client_id', c.id
        )
        WHEN 'integration' THEN ds.metadata
        WHEN 'device' THEN jsonb_build_object(
            'device_id', ds.device_id,
            'metadata', ds.metadata
        )
        ELSE ds.metadata
    END as source_details
FROM medical.variable_measurements m
JOIN medical.data_sources ds ON m.source_id = ds.id
LEFT JOIN medical.data_imports di ON ds.import_id = di.id
LEFT JOIN oauth2.clients c ON ds.client_id = c.id;

-- Add comment explaining the data sources system
COMMENT ON TABLE medical.data_sources IS 
'Centralized registry of all data sources that can contribute measurements to the system. 
This includes file imports, OAuth clients, third-party integrations, devices, and manual entry.
Each source type has its own identifier pattern and metadata structure.'; 