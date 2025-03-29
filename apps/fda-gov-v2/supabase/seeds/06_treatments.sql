-- Treatments seed file
-- Contains seed data for treatments (medications, biologics, etc.)

-- Insert sample treatments
INSERT INTO treatments (id, global_variable_id, treatment_type, manufacturer, approval_status) VALUES
('metformin', 'metformin', 'Medication', 'Various', 'Approved'),
('lisinopril', 'lisinopril', 'Medication', 'Various', 'Approved'),
('adalimumab', 'adalimumab', 'Biologic', 'AbbVie', 'Approved'),
('escitalopram', 'escitalopram', 'Medication', 'Various', 'Approved'),
('albuterol', 'albuterol', 'Medication', 'Various', 'Approved'),
('semaglutide', 'semaglutide', 'Medication', 'Novo Nordisk', 'Approved'),
('ketamine', 'ketamine', 'Medication', 'Various', 'Off-label'),
('tocilizumab', 'tocilizumab', 'Biologic', 'Genentech', 'Approved'),
('aspirin', 'aspirin', 'Medication', 'Various', 'Approved'),
('ibuprofen', 'ibuprofen', 'Medication', 'Various', 'Approved'),
('sitagliptin', 'sitagliptin', 'Medication', 'Merck', 'Approved'),
('venlafaxine', 'venlafaxine', 'Medication', 'Various', 'Approved');
