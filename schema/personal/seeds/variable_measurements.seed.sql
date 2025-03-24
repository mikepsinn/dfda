-- Seed: personal.variable_measurements
-- Seed data for personal.variable_measurements

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
