-- Conditions seed file
-- Contains seed data for medical conditions

-- Insert sample conditions
-- The id references the global_variable_id and is the primary key
INSERT INTO conditions (id, icd_code)
VALUES
('type-2-diabetes', 'E11'),
('hypertension', 'I10'),
('rheumatoid-arthritis', 'M05'),
('major-depressive-disorder', 'F33'),
('asthma', 'J45'),
('headache', 'R51'),
('pain', 'R52');
