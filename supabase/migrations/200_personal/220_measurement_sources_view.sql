-- Create a view to see measurement sources with context
CREATE OR REPLACE VIEW personal.measurement_sources AS
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
FROM personal.variable_measurements m
JOIN reference.data_sources ds ON m.source_id = ds.id
LEFT JOIN personal.data_imports di ON ds.import_id = di.id
LEFT JOIN oauth2.clients c ON ds.client_id = c.id; 