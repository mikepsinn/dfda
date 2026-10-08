-- Conditions seed file
-- Contains seed data for medical conditions

-- Insert sample conditions
-- The id references the global_variable_id and is the primary key
INSERT INTO global_conditions (id, icd_code)
VALUES
('type-2-diabetes', 'E11'),
('hypertension', 'I10'),
('rheumatoid-arthritis', 'M05'),
('major-depressive-disorder', 'F33'),
('asthma', 'J45'),
('headache', 'R51'),
('pain', 'R52'),
-- Added Common Conditions Start
('hyperlipidemia', 'E78.5'),
('mixed-hyperlipidemia', 'E78.2'),
('low-back-pain', 'M54.5'),
('copd', 'J44.9'),
('atrial-fibrillation', 'I48.91'),
('abdominal-pain', 'R10.9'),
('uti', 'N39.0'),
('anxiety', 'F41.9'),
('gerd', 'K21.9'),
('chest-pain', 'R07.9'),
('upper-respiratory-infection', 'J06.9'),
('pneumonia', 'J18.9'),
('acute-bronchitis', 'J20.9'),
('knee-pain', 'M25.569'),
('heart-failure', 'I50.9'),
('hypothyroidism', 'E03.9'),
('vitamin-d-deficiency', 'E55.9'),
-- Added Common Conditions End
-- Added Long COVID
('long-covid', 'U09.9'),
-- Added COVID-19
('covid-19', 'U07.1');
