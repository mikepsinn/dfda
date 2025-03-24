-- Seed: personal.medications
-- Seed data for personal.medications

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
