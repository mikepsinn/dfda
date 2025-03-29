-- Trials seed file
-- Contains seed data for clinical trials and enrollments

-- Insert sample trials
INSERT INTO trials (id, title, description, sponsor_id, condition_id, treatment_id, status, phase, start_date, end_date, enrollment_target, current_enrollment, location, compensation) VALUES
('11111111-1111-1111-1111-111111111111', 'Semaglutide Efficacy Study', 'A randomized controlled trial to evaluate the efficacy of Semaglutide in patients with Type 2 Diabetes.', '30000000-0000-0000-0000-000000000001', 'type-2-diabetes', 'semaglutide', 'recruiting', 'phase_3', '2025-01-15', '2026-07-15', 500, 125, 'Multiple locations nationwide', 1200),
('22222222-2222-2222-2222-222222222222', 'Ketamine for Treatment-Resistant Depression', 'Evaluating the safety and efficacy of Ketamine in patients with treatment-resistant major depressive disorder.', '30000000-0000-0000-0000-000000000002', 'major-depressive-disorder', 'ketamine', 'recruiting', 'phase_2', '2025-02-01', '2026-02-01', 200, 45, 'Boston, New York, Chicago, San Francisco', 1500),
('33333333-3333-3333-3333-333333333333', 'Tocilizumab Therapy for Refractory RA', 'Testing Tocilizumab for patients with rheumatoid arthritis who have not responded to conventional treatments.', '30000000-0000-0000-0000-000000000002', 'rheumatoid-arthritis', 'tocilizumab', 'recruiting', 'phase_3', '2024-12-01', '2026-06-01', 350, 210, 'Multiple locations nationwide', 1000),
('44444444-4444-4444-4444-444444444444', 'Extended Release Metformin Study', 'Evaluating a new extended-release formulation of Metformin for improved glycemic control in Type 2 Diabetes.', '30000000-0000-0000-0000-000000000001', 'type-2-diabetes', 'metformin', 'completed', 'phase_4', '2023-05-10', '2024-11-10', 400, 400, 'Multiple locations nationwide', 800),
('55555555-5555-5555-5555-555555555555', 'Combination Therapy for Resistant Hypertension', 'Testing the efficacy of a novel combination therapy approach for patients with resistant hypertension.', '30000000-0000-0000-0000-000000000001', 'hypertension', 'lisinopril', 'pending_approval', 'phase_2', '2025-06-01', '2026-12-01', 250, 0, 'Chicago, Houston, Miami', 1100);

-- Insert trial enrollments
INSERT INTO trial_enrollments (trial_id, patient_id, doctor_id, status, enrollment_date) VALUES
('11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'approved', '2025-02-10'),
('33333333-3333-3333-3333-333333333333', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'approved', '2025-01-15'),
('44444444-4444-4444-4444-444444444444', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'completed', '2023-06-01');

-- Insert sample data submissions
INSERT INTO data_submissions (enrollment_id, patient_id, submission_date, data, status) VALUES
((SELECT id FROM trial_enrollments WHERE trial_id = '11111111-1111-1111-1111-111111111111' AND patient_id = '10000000-0000-0000-0000-000000000001' LIMIT 1), 
 '10000000-0000-0000-0000-000000000001', 
 '2025-03-10', 
 '{"blood_glucose": 142, "weight": 84, "medication_adherence": 95, "side_effects": ["mild nausea"], "notes": "Feeling better overall"}', 
 'submitted'),
((SELECT id FROM trial_enrollments WHERE trial_id = '33333333-3333-3333-3333-333333333333' AND patient_id = '10000000-0000-0000-0000-000000000002' LIMIT 1), 
 '10000000-0000-0000-0000-000000000002', 
 '2025-02-15', 
 '{"joint_pain_score": 4, "mobility_score": 7, "medication_adherence": 100, "side_effects": [], "notes": "Noticeable improvement in morning stiffness"}', 
 'submitted');
