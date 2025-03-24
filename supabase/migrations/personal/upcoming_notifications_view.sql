-- Upcoming Notifications View
--
-- Shows pending notifications that are scheduled for the near future
-- Useful for notification processing and user dashboards
--
CREATE VIEW personal.upcoming_notifications AS
SELECT 
    n.*,
    CASE 
        WHEN n.type = 'MEDICATION_REMINDER' THEN m.title
        WHEN n.type = 'LAB_RESULT' THEN l.title
        WHEN n.type = 'MEASUREMENT_REMINDER' THEN v.display_name
        ELSE NULL
    END as source_title,
    CASE 
        WHEN n.type = 'MEDICATION_REMINDER' THEN m.notes
        WHEN n.type = 'LAB_RESULT' THEN l.notes
        WHEN n.type = 'MEASUREMENT_REMINDER' THEN v.description
        ELSE NULL
    END as source_details
FROM personal.user_notifications n
LEFT JOIN personal.user_medications m ON n.triggered_by_id = m.id AND n.type = 'MEDICATION_REMINDER'
LEFT JOIN personal.user_lab_results l ON n.triggered_by_id = l.id AND n.type = 'LAB_RESULT'
LEFT JOIN personal.user_variables v ON n.triggered_by_id = v.id AND n.type = 'MEASUREMENT_REMINDER'
WHERE n.status = 'PENDING'
AND n.scheduled_for >= NOW()
AND n.scheduled_for <= NOW() + INTERVAL '7 days'; 