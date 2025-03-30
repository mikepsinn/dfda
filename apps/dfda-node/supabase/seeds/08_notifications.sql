-- Notifications seed file
-- Contains seed data for user notifications

-- Insert notifications
INSERT INTO notifications (user_id, title, message, type, read_at, emoji) VALUES
('10000000-0000-0000-0000-000000000001', 'Data Submission Reminder', 'Your weekly data submission for the GLP-1 XR-42 trial is due tomorrow.', 'info', NULL, '📅'),
('10000000-0000-0000-0000-000000000001', 'Upcoming Appointment', 'You have a follow-up appointment scheduled for April 5, 2025 at 10:00 AM.', 'info', NULL, '📆'),
('10000000-0000-0000-0000-000000000002', 'Trial Update', 'New information about your Anti-IL-6 trial is available. Please check the trial portal.', 'info', CURRENT_TIMESTAMP, '📣'),
('20000000-0000-0000-0000-000000000001', 'New Patient Enrollment', 'A new patient has enrolled in the GLP-1 XR-42 trial.', 'info', NULL, '👥'),
('30000000-0000-0000-0000-000000000001', 'Enrollment Milestone', 'Your GLP-1 XR-42 trial has reached 25% enrollment target.', 'info', CURRENT_TIMESTAMP, '🎉');
