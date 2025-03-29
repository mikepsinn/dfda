-- Treatments seed file
-- Contains seed data for treatments (medications, biologics, etc.)

-- Insert sample treatments
INSERT INTO treatments (id, treatment_type, manufacturer, approval_status) VALUES
('metformin', 'Medication', 'Various', 'Approved'),
('lisinopril', 'Medication', 'Various', 'Approved'),
('adalimumab', 'Biologic', 'AbbVie', 'Approved'),
('escitalopram', 'Medication', 'Various', 'Approved'),
('albuterol', 'Medication', 'Various', 'Approved'),
('semaglutide', 'Medication', 'Novo Nordisk', 'Approved'),
('ketamine', 'Medication', 'Various', 'investigational'),
('tocilizumab', 'Biologic', 'Genentech', 'Approved'),
('aspirin', 'Medication', 'Various', 'Approved'),
('ibuprofen', 'Medication', 'Various', 'Approved'),
('sitagliptin', 'Medication', 'Merck', 'Approved'),
('venlafaxine', 'Medication', 'Various', 'Approved');
