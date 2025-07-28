-- Seed: logistics.shipping_methods
-- Seed data for logistics.shipping_methods

INSERT INTO logistics.shipping_methods (name, description, estimated_days_min, estimated_days_max, is_active) VALUES
('standard', 'Standard shipping (5-7 business days)', 5, 7, true),
('express', 'Express shipping (2-3 business days)', 2, 3, true),
('overnight', 'Overnight shipping (next business day)', 1, 1, true),
('international', 'International shipping (7-14 business days)', 7, 14, true);
