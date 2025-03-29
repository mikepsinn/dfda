-- Variable Categories seed file
-- Contains seed data for variable categories

-- Insert variable categories
INSERT INTO variable_categories (id, name, description, emoji)
VALUES
('side-effect', 'Side Effect', 'Side effects of treatments', '🤢'),
('vital-sign', 'Vital Sign', 'Vital signs and measurements', '📊'),
('symptom', 'Symptom', 'Disease or condition symptoms', '🤒'),
('lab-test', 'Lab Test', 'Laboratory test results', '🧪'),
('condition', 'Condition', 'Medical conditions and diseases', '🏥'),
('treatment', 'Treatment', 'Medical treatments and interventions', '💊');
