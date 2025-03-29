-- Conditions seed file
-- Contains seed data for medical conditions

-- Insert sample conditions
INSERT INTO conditions (id, global_variable_id, icd_code) VALUES
('type-2-diabetes', 'type-2-diabetes', 'E11'),
('hypertension', 'hypertension', 'I10'),
('rheumatoid-arthritis', 'rheumatoid-arthritis', 'M05'),
('major-depressive-disorder', 'major-depressive-disorder', 'F33'),
('asthma', 'asthma', 'J45'),
('headache', 'headache', 'R51'),
('pain', 'pain', 'R52');
