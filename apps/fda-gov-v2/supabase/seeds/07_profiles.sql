-- Profiles seed file
-- Contains seed data for user profiles and patient details

-- First, create auth.users entries for our sample users
-- We need to disable RLS for this operation
BEGIN;
SET LOCAL ROLE postgres;

-- Insert sample users into auth.users (only using id and email fields)
INSERT INTO auth.users (id, email)
VALUES
('10000000-0000-0000-0000-000000000001', 'alice@example.com'),
('10000000-0000-0000-0000-000000000002', 'bob@example.com'),
('10000000-0000-0000-0000-000000000003', 'charlie@example.com'),
('20000000-0000-0000-0000-000000000001', 'dr.david@example.com'),
('20000000-0000-0000-0000-000000000002', 'dr.emily@example.com'),
('30000000-0000-0000-0000-000000000001', 'john.sponsor@pharma.com'),
('30000000-0000-0000-0000-000000000002', 'lisa@bioadvance.com')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Update profiles with additional information
UPDATE profiles SET
  first_name = 'Alice',
  last_name = 'Johnson',
  user_type = 'patient'
WHERE id = '10000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  first_name = 'Bob',
  last_name = 'Smith',
  user_type = 'patient'
WHERE id = '10000000-0000-0000-0000-000000000002';

UPDATE profiles SET
  first_name = 'Charlie',
  last_name = 'Brown',
  user_type = 'patient'
WHERE id = '10000000-0000-0000-0000-000000000003';

-- Update doctor profiles
UPDATE profiles SET
  first_name = 'Dr. David',
  last_name = 'Williams',
  user_type = 'doctor'
WHERE id = '20000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  first_name = 'Dr. Emily',
  last_name = 'Chen',
  user_type = 'doctor'
WHERE id = '20000000-0000-0000-0000-000000000002';

-- Update sponsor profiles
UPDATE profiles SET
  first_name = 'John',
  last_name = 'Davis',
  user_type = 'sponsor'
WHERE id = '30000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  first_name = 'Lisa',
  last_name = 'Martinez',
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
('10000000-0000-0000-0000-000000000001', 'type-2-diabetes', '20000000-0000-0000-0000-000000000001', '2020-03-15', 'active'),
('10000000-0000-0000-0000-000000000001', 'hypertension', '20000000-0000-0000-0000-000000000001', '2021-05-22', 'active'),
('10000000-0000-0000-0000-000000000002', 'asthma', '20000000-0000-0000-0000-000000000002', '2019-11-10', 'active'),
('10000000-0000-0000-0000-000000000003', 'headache', '20000000-0000-0000-0000-000000000002', '2022-01-05', 'active'),
('10000000-0000-0000-0000-000000000003', 'pain', '20000000-0000-0000-0000-000000000001', '2018-07-20', 'active')
ON CONFLICT DO NOTHING;
