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
('30000000-0000-0000-0000-000000000001', 'john.research_partner@pharma.com'),
('30000000-0000-0000-0000-000000000002', 'lisa@bioadvance.com'),
('40000000-0000-0000-0000-000000000001', 'michael@devteam.io'),
('40000000-0000-0000-0000-000000000002', 'sophia@apidevs.com')
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

-- Update provider profiles
UPDATE profiles SET
  first_name = 'Dr. David',
  last_name = 'Williams',
  user_type = 'provider'
WHERE id = '20000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  first_name = 'Dr. Emily',
  last_name = 'Chen',
  user_type = 'provider'
WHERE id = '20000000-0000-0000-0000-000000000002';

-- Update sponsor profiles
UPDATE profiles SET
  first_name = 'John',
  last_name = 'Davis',
  user_type = 'research-partner'
WHERE id = '30000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  first_name = 'Lisa',
  last_name = 'Martinez',
  user_type = 'research-partner'
WHERE id = '30000000-0000-0000-0000-000000000002';

-- Update developer profiles
UPDATE profiles SET
  first_name = 'Michael',
  last_name = 'Rodriguez',
  user_type = 'developer'
WHERE id = '40000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  first_name = 'Sophia',
  last_name = 'Kim',
  user_type = 'developer'
WHERE id = '40000000-0000-0000-0000-000000000002';

-- Insert patient details
INSERT INTO patients (id, date_of_birth, gender, height, weight, blood_type) VALUES
('10000000-0000-0000-0000-000000000001', '1975-06-15', 'male', 180, 85, 'O+'),
('10000000-0000-0000-0000-000000000002', '1982-03-22', 'female', 165, 62, 'A-'),
('10000000-0000-0000-0000-000000000003', '1968-11-30', 'male', 175, 90, 'B+')
ON CONFLICT (id) DO NOTHING;

-- Insert patient conditions
INSERT INTO patient_conditions (patient_id, condition_id, diagnosed_at, status) VALUES
('10000000-0000-0000-0000-000000000001', 'type-2-diabetes', '2020-03-15', 'active'),
('10000000-0000-0000-0000-000000000001', 'hypertension', '2021-05-22', 'active'),
('10000000-0000-0000-0000-000000000002', 'asthma', '2019-11-10', 'active'),
('10000000-0000-0000-0000-000000000003', 'headache', '2022-01-05', 'active'),
('10000000-0000-0000-0000-000000000003', 'pain', '2018-07-20', 'active')
ON CONFLICT DO NOTHING;
