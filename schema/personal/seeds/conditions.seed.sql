-- Seed: personal.conditions
-- Seed data for personal.conditions

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
