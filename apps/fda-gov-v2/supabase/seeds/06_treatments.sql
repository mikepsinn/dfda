-- Treatments seed file
-- Contains seed data for treatments (medications, biologics, etc.)

-- Insert sample treatments
INSERT INTO treatments (id, treatment_type, manufacturer, approval_status) VALUES
('metformin', 'drug', 'Various', 'approved'),
('lisinopril', 'drug', 'Various', 'approved'),
('adalimumab', 'biologic', 'AbbVie', 'approved'),
('escitalopram', 'drug', 'Various', 'approved'),
('albuterol', 'drug', 'Various', 'approved'),
('semaglutide', 'drug', 'Novo Nordisk', 'approved'),
('ketamine', 'drug', 'Various', 'investigational'),
('tocilizumab', 'biologic', 'Genentech', 'approved'),
('aspirin', 'drug', 'Various', 'approved'),
('ibuprofen', 'drug', 'Various', 'approved'),
('sitagliptin', 'drug', 'Merck', 'approved'),
('venlafaxine', 'drug', 'Various', 'approved');
