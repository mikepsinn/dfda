-- Create view for import status and statistics
CREATE OR REPLACE VIEW personal.import_statistics AS
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
FROM personal.data_imports di
LEFT JOIN personal.extracted_data_points edp ON di.id = edp.import_id
WHERE di.deleted_at IS NULL
GROUP BY di.id, di.user_id, di.file_name, di.file_type, di.import_type, 
         di.processing_status, di.processed_at, di.retention_required, 
         di.retention_until, di.access_level, di.document_date, di.tags; 