-- Treatments seed file
-- Contains seed data for treatments (medications, biologics, etc.)

-- Insert sample treatments
INSERT INTO global_treatments (id, treatment_type, manufacturer) VALUES
('metformin', 'drug', 'Various'),
('lisinopril', 'drug', 'Various'),
('adalimumab', 'biologic', 'AbbVie'),
('escitalopram', 'drug', 'Various'),
('albuterol', 'drug', 'Various'),
('semaglutide', 'drug', 'Novo Nordisk'),
('ketamine', 'drug', 'Various'),
('tocilizumab', 'biologic', 'Genentech'),
('aspirin', 'drug', 'Various'),
('ibuprofen', 'drug', 'Various'),
('sitagliptin', 'drug', 'Merck'),
('venlafaxine', 'drug', 'Various');
