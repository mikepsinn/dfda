-- Profiles seed file
-- Contains seed data for user profiles and patient details

-- Insert sample user profiles
INSERT INTO profiles (id, email, first_name, last_name, user_type) VALUES
-- Patients
('10000000-0000-0000-0000-000000000001', 'alice@example.com', 'Alice', 'Johnson', 'patient'),
('10000000-0000-0000-0000-000000000002', 'bob@example.com', 'Bob', 'Smith', 'patient'),
('10000000-0000-0000-0000-000000000003', 'charlie@example.com', 'Charlie', 'Brown', 'patient'),
-- Doctors
('20000000-0000-0000-0000-000000000001', 'dr.david@example.com', 'Dr. David', 'Williams', 'doctor'),
('20000000-0000-0000-0000-000000000002', 'dr.emily@example.com', 'Dr. Emily', 'Chen', 'doctor'),
-- Sponsors
('30000000-0000-0000-0000-000000000001', 'john.sponsor@pharma.com', 'John', 'Davis', 'sponsor'),
('30000000-0000-0000-0000-000000000002', 'lisa@bioadvance.com', 'Lisa', 'Martinez', 'sponsor');

-- Update doctor profiles with specialties and organizations
UPDATE profiles SET
  specialty = 'Endocrinology',
  organization_name = 'Metro Medical Center'
WHERE id = '20000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  specialty = 'Psychiatry, Rheumatology',
  organization_name = 'University Hospital'
WHERE id = '20000000-0000-0000-0000-000000000002';

-- Update sponsor profiles with organization details
UPDATE profiles SET
  organization_name = 'Pharma Research Inc.',
  contact_name = 'John Davis',
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
