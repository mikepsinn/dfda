-- Seed: scheduling.service_types
-- Seed data for scheduling.service_types

INSERT INTO scheduling.service_types (name, description, duration_minutes, is_active) VALUES
('initial_consultation', 'Initial medical consultation', 60, true),
('follow_up', 'Follow-up appointment', 30, true),
('lab_review', 'Laboratory results review', 30, true),
('treatment_session', 'Treatment session', 45, true),
('emergency_consultation', 'Emergency consultation', 60, true);
