-- Seed: core.user_groups
-- Seed data for core.user_groups

INSERT INTO core.user_groups (name, description) VALUES
('administrators', 'System administrators with full access'),
('staff', 'Staff members with elevated privileges'),
('researchers', 'Research team members'),
('providers', 'Healthcare providers'),
('patients', 'Regular patients/users');
