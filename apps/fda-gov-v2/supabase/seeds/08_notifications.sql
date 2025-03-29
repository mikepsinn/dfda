-- Notifications seed file
-- Contains seed data for user notifications

-- Insert notifications
INSERT INTO notifications (user_id, title, message, notification_type, scheduled_for, is_read) VALUES
('10000000-0000-0000-0000-000000000001', 'Data Submission Reminder', 'Your weekly data submission for the GLP-1 XR-42 trial is due tomorrow.', 'reminder', '2025-03-27 09:00:00', false),
('10000000-0000-0000-0000-000000000001', 'Upcoming Appointment', 'You have a follow-up appointment scheduled for April 5, 2025 at 10:00 AM.', 'appointment', '2025-03-29 09:00:00', false),
('10000000-0000-0000-0000-000000000002', 'Trial Update', 'New information about your Anti-IL-6 trial is available. Please check the trial portal.', 'update', '2025-03-26 14:30:00', true),
('20000000-0000-0000-0000-000000000001', 'New Patient Enrollment', 'A new patient has enrolled in the GLP-1 XR-42 trial.', 'enrollment', '2025-03-25 11:15:00', false),
('30000000-0000-0000-0000-000000000001', 'Enrollment Milestone', 'Your GLP-1 XR-42 trial has reached 25% enrollment target.', 'milestone', '2025-03-20 16:45:00', true);
