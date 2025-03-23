-- Function to process approved data points
CREATE OR REPLACE FUNCTION personal.process_approved_data_points(
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
    INSERT INTO reference.data_sources (
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
    FROM personal.data_imports di
    WHERE di.id = p_import_id
    ON CONFLICT (import_id) WHERE source_type = 'data_import'
    DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_source_id;

    -- Process measurements with source_id
    INSERT INTO personal.variable_measurements (
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
    FROM personal.extracted_data_points edp
    JOIN personal.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'measurement'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = ROW_COUNT;

    -- Process conditions
    INSERT INTO personal.conditions (
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
    FROM personal.extracted_data_points edp
    JOIN personal.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'condition'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = v_processed_count + ROW_COUNT;

    -- Process medications
    INSERT INTO personal.medications (
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
    FROM personal.extracted_data_points edp
    JOIN personal.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'medication'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = v_processed_count + ROW_COUNT;

    -- Process lab results
    INSERT INTO personal.lab_results (
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
    FROM personal.extracted_data_points edp
    JOIN personal.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'lab_result'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = v_processed_count + ROW_COUNT;

    -- Update import status
    UPDATE personal.data_imports
    SET 
        processing_status = 'completed',
        processed_at = CURRENT_TIMESTAMP,
        reviewed_by = p_reviewed_by
    WHERE id = p_import_id;

    RETURN v_processed_count;
END;
$$;

-- Function to soft delete an import and its data
CREATE OR REPLACE FUNCTION personal.soft_delete_import(
    p_import_id uuid,
    p_deletion_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if retention is required
    IF EXISTS (
        SELECT 1 FROM personal.data_imports
        WHERE id = p_import_id
        AND retention_required = true
        AND (retention_until IS NULL OR retention_until > CURRENT_TIMESTAMP)
    ) THEN
        RAISE EXCEPTION 'Cannot delete import: retention required';
    END IF;

    -- Soft delete the import
    UPDATE personal.data_imports
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