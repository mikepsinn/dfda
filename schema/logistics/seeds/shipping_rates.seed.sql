-- Seed: logistics.shipping_rates
-- Seed data for logistics.shipping_rates

INSERT INTO logistics.shipping_rates (shipping_method_id, zone, base_rate, rate_per_kg) VALUES
((SELECT id FROM logistics.shipping_methods WHERE name = 'standard'), 'domestic', 5.99, 0.50),
((SELECT id FROM logistics.shipping_methods WHERE name = 'express'), 'domestic', 12.99, 1.00),
((SELECT id FROM logistics.shipping_methods WHERE name = 'overnight'), 'domestic', 24.99, 2.00),
((SELECT id FROM logistics.shipping_methods WHERE name = 'international'), 'international', 19.99, 3.00);
