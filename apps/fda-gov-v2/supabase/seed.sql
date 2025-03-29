-- seed.sql
-- This file contains seed data for development and testing

-- Insert sample conditions
INSERT INTO conditions (id, name, description, icd_code) VALUES
('11111111-1111-1111-1111-111111111111', 'Type 2 Diabetes', 'A chronic condition that affects the way the body processes blood sugar (glucose).', 'E11'),
('22222222-2222-2222-2222-222222222222', 'Hypertension', 'High blood pressure is a common condition in which the long-term force of the blood against your artery walls is high enough that it may eventually cause health problems.', 'I10'),
('33333333-3333-3333-3333-333333333333', 'Rheumatoid Arthritis', 'An autoimmune and inflammatory disease, which means that your immune system attacks healthy cells in your body by mistake, causing inflammation in the affected parts of the body.', 'M05'),
('44444444-4444-4444-4444-444444444444', 'Major Depressive Disorder', 'A mental health disorder characterized by persistently depressed mood or loss of interest in activities, causing significant impairment in daily life.', 'F33'),
('55555555-5555-5555-5555-555555555555', 'Asthma', 'A condition in which your airways narrow and swell and may produce extra mucus, making breathing difficult and triggering coughing, wheezing and shortness of breath.', 'J45');

-- Insert sample treatments
INSERT INTO treatments (id, name, description, treatment_type, manufacturer, approval_status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Metformin', 'First-line medication for the treatment of type 2 diabetes.', 'Medication', 'Various', 'Approved'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Lisinopril', 'Medication to treat high blood pressure and heart failure.', 'Medication', 'Various', 'Approved'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Adalimumab', 'Biologic medication used to treat rheumatoid arthritis and other inflammatory conditions.', 'Biologic', 'AbbVie', 'Approved'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Escitalopram', 'Selective serotonin reuptake inhibitor (SSRI) used to treat depression and anxiety disorders.', 'Medication', 'Various', 'Approved'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Albuterol', 'Medication that opens up the bronchial tubes (air passages) in the lungs when they are spasming.', 'Medication', 'Various', 'Approved'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'GLP-1 Receptor Agonist XR-42', 'Experimental long-acting GLP-1 receptor agonist for type 2 diabetes.', 'Medication', 'Pharma Research Inc.', 'Phase 3'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'NK Cell Therapy RT-7', 'Novel immunotherapy approach for treatment-resistant depression.', 'Biologic', 'BioAdvance Therapeutics', 'Phase 2'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Anti-IL-6 Monoclonal Antibody', 'Targeted therapy for rheumatoid arthritis that doesn\'t respond to current treatments.', 'Biologic', 'ImmunoGen Labs', 'Phase 3');

-- Insert sample treatment effectiveness data
INSERT INTO treatment_effectiveness (treatment_id, condition_id, effectiveness_score, side_effects_score, cost_effectiveness_score, evidence_level) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 8.5, 7.0, 9.0, 'High'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 8.0, 6.5, 8.5, 'High'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 9.0, 5.5, 6.0, 'High'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 7.5, 6.0, 7.5, 'Moderate'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 8.0, 7.0, 8.0, 'High'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 9.5, 7.5, 5.0, 'Moderate'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', '44444444-4444-4444-4444-444444444444', 8.5, 7.0, 4.5, 'Low'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '33333333-3333-3333-3333-333333333333', 9.0, 6.5, 4.0, 'Moderate');

-- Insert sample user profiles (patients, doctors, sponsors)
INSERT INTO auth.users (id, email) VALUES
('10000000-0000-0000-0000-000000000001', 'patient1@example.com'),
('10000000-0000-0000-0000-000000000002', 'patient2@example.com'),
('10000000-0000-0000-0000-000000000003', 'patient3@example.com'),
('20000000-0000-0000-0000-000000000001', 'doctor1@example.com'),
('20000000-0000-0000-0000-000000000002', 'doctor2@example.com'),
('30000000-0000-0000-0000-000000000001', 'sponsor1@example.com'),
('30000000-0000-0000-0000-000000000002', 'sponsor2@example.com')
ON CONFLICT (id) DO NOTHING;

-- Update profiles with more information
UPDATE profiles SET
  first_name = 'John',
  last_name = 'Smith',
  user_type = 'patient'
WHERE id = '10000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  first_name = 'Sarah',
  last_name = 'Johnson',
  user_type = 'patient'
WHERE id = '10000000-0000-0000-0000-000000000002';

UPDATE profiles SET
  first_name = 'Michael',
  last_name = 'Williams',
  user_type = 'patient'
WHERE id = '10000000-0000-0000-0000-000000000003';

UPDATE profiles SET
  first_name = 'Dr. Emily',
  last_name = 'Chen',
  user_type = 'doctor'
WHERE id = '20000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  first_name = 'Dr. James',
  last_name = 'Wilson',
  user_type = 'doctor'
WHERE id = '20000000-0000-0000-0000-000000000002';

UPDATE profiles SET
  organization_name = 'Pharma Research Inc.',
  contact_name = 'Robert Johnson',
  user_type = 'sponsor'
WHERE id = '30000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  organization_name = 'BioAdvance Therapeutics',
  contact_name = 'Lisa Martinez',
  user_type = 'sponsor'
WHERE id = '30000000-0000-0000-0000-000000000002';

-- Insert patient details
INSERT INTO patients (id, date_of_birth, gender, height, weight, blood_type, insurance_provider, insurance_id) VALUES
('10000000-0000-0000-0000-000000000001', '1975-06-15', 'Male', 180, 85, 'O+', 'Blue Cross', 'BC123456789'),
('10000000-0000-0000-0000-000000000002', '1982-03-22', 'Female', 165, 62, 'A-', 'Aetna', 'AE987654321'),
('10000000-0000-0000-0000-000000000003', '1968-11-30', 'Male', 175, 90, 'B+', 'United Health', 'UH456789123')
ON CONFLICT (id) DO NOTHING;

-- Insert patient conditions
INSERT INTO patient_conditions (patient_id, condition_id, diagnosing_doctor_id, diagnosis_date, status) VALUES
('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '20000000-0000-0000-0000-000000000001', '2020-03-15', 'active'),
('10000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '20000000-0000-0000-0000-000000000001', '2021-05-22', 'active'),
('10000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '20000000-0000-0000-0000-000000000002', '2019-11-10', 'active'),
('10000000-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', '20000000-0000-0000-0000-000000000002', '2022-01-05', 'active'),
('10000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', '20000000-0000-0000-0000-000000000001', '2018-07-20', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample trials
INSERT INTO trials (id, title, description, sponsor_id, condition_id, treatment_id, status, phase, start_date, end_date, enrollment_target, current_enrollment, location, compensation) VALUES
('tr111111-1111-1111-1111-111111111111', 'GLP-1 XR-42 Efficacy Study', 'A randomized controlled trial to evaluate the efficacy of GLP-1 Receptor Agonist XR-42 in patients with Type 2 Diabetes.', '30000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'recruiting', 'Phase 3', '2025-01-15', '2026-07-15', 500, 125, 'Multiple locations nationwide', 1200),
('tr222222-2222-2222-2222-222222222222', 'NK Cell Therapy for Treatment-Resistant Depression', 'Evaluating the safety and efficacy of NK Cell Therapy RT-7 in patients with treatment-resistant major depressive disorder.', '30000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'recruiting', 'Phase 2', '2025-02-01', '2026-02-01', 200, 45, 'Boston, New York, Chicago, San Francisco', 1500),
('tr333333-3333-3333-3333-333333333333', 'Novel Anti-IL-6 Therapy for Refractory RA', 'Testing a novel Anti-IL-6 Monoclonal Antibody for patients with rheumatoid arthritis who have not responded to conventional treatments.', '30000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'recruiting', 'Phase 3', '2024-12-01', '2026-06-01', 350, 210, 'Multiple locations nationwide', 1000),
('tr444444-4444-4444-4444-444444444444', 'Extended Release Metformin Study', 'Evaluating a new extended-release formulation of Metformin for improved glycemic control in Type 2 Diabetes.', '30000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', 'Phase 4', '2023-05-10', '2024-11-10', 400, 400, 'Multiple locations nationwide', 800),
('tr555555-5555-5555-5555-555555555555', 'Combination Therapy for Resistant Hypertension', 'Testing the efficacy of a novel combination therapy approach for patients with resistant hypertension.', '30000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'pending_approval', 'Phase 2', '2025-06-01', '2026-12-01', 250, 0, 'Chicago, Houston, Miami', 1100);

-- Insert trial enrollments
INSERT INTO trial_enrollments (trial_id, patient_id, doctor_id, status, enrollment_date) VALUES
('tr111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'active', '2025-02-10'),
('tr333333-3333-3333-3333-333333333333', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'active', '2025-01-15'),
('tr444444-4444-4444-4444-444444444444', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'completed', '2023-06-01');

-- Insert sample data submissions
INSERT INTO data_submissions (enrollment_id, patient_id, submission_date, data, status) VALUES
((SELECT id FROM trial_enrollments WHERE trial_id = 'tr111111-1111-1111-1111-111111111111' AND patient_id = '10000000-0000-0000-0000-000000000001' LIMIT 1), 
 '10000000-0000-0000-0000-000000000001', 
 '2025-03-10', 
 '{"blood_glucose": 142, "weight": 84, "medication_adherence": 95, "side_effects": ["mild nausea"], "notes": "Feeling better overall"}', 
 'submitted'),
((SELECT id FROM trial_enrollments WHERE trial_id = 'tr333333-3333-3333-3333-333333333333' AND patient_id = '10000000-0000-0000-0000-000000000002' LIMIT 1), 
 '10000000-0000-0000-0000-000000000002', 
 '2025-02-15', 
 '{"joint_pain_score": 4, "mobility_score": 7, "medication_adherence": 100, "side_effects": [], "notes": "Noticeable improvement in morning stiffness"}', 
 'submitted');

-- Insert notifications
INSERT INTO notifications (user_id, title, message, notification_type, scheduled_for, is_read) VALUES
('10000000-0000-0000-0000-000000000001', 'Data Submission Reminder', 'Your weekly data submission for the GLP-1 XR-42 trial is due tomorrow.', 'reminder', '2025-03-27 09:00:00', false),
('10000000-0000-0000-0000-000000000001', 'Upcoming Appointment', 'You have a follow-up appointment scheduled for April 5, 2025 at 10:00 AM.', 'appointment', '2025-03-29 09:00:00', false),
('10000000-0000-0000-0000-000000000002', 'Trial Update', 'New information about your Anti-IL-6 trial is available. Please check the trial portal.', 'update', '2025-03-26 14:30:00', true),
('20000000-0000-0000-0000-000000000001', 'New Patient Enrollment', 'A new patient has enrolled in the GLP-1 XR-42 trial.', 'enrollment', '2025-03-25 11:15:00', false),
('30000000-0000-0000-0000-000000000001', 'Enrollment Milestone', 'Your GLP-1 XR-42 trial has reached 25% enrollment target.', 'milestone', '2025-03-20 16:45:00', true);

-- Insert treatment ratings
INSERT INTO treatment_ratings (user_id, treatment_id, rating, review, verified)
VALUES
('10000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 8, 'Helped control my blood sugar with minimal side effects.', true),
('10000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 9, 'Life-changing improvement in my joint pain and mobility.', true),
('10000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 6, 'Some improvement noted, monitoring closely.', false),
('20000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 9, 'Consistently effective first-line treatment for my T2D patients.', true),
('20000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 8, 'Good efficacy for most RA patients, though cost can be prohibitive.', true);

COMMIT;
