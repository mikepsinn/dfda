-- Shipping Methods and Rates
--
-- Defines available shipping methods and their associated rates
-- Used for calculating shipping costs and delivery estimates
--
CREATE TABLE logistics.shipping_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    estimated_days_min INTEGER NOT NULL,
    estimated_days_max INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping rates for different zones
CREATE TABLE logistics.shipping_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_method_id UUID NOT NULL REFERENCES logistics.shipping_methods(id),
    zone VARCHAR(50) NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,
    rate_per_kg DECIMAL(10,2) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shipping_method_id, zone)
);

-- Seed shipping methods
INSERT INTO logistics.shipping_methods (name, description, estimated_days_min, estimated_days_max, is_active) VALUES
('standard', 'Standard shipping (5-7 business days)', 5, 7, true),
('express', 'Express shipping (2-3 business days)', 2, 3, true),
('overnight', 'Overnight shipping (next business day)', 1, 1, true),
('international', 'International shipping (7-14 business days)', 7, 14, true);

-- Seed shipping rates
INSERT INTO logistics.shipping_rates (shipping_method_id, zone, base_rate, rate_per_kg) VALUES
((SELECT id FROM logistics.shipping_methods WHERE name = 'standard'), 'domestic', 5.99, 0.50),
((SELECT id FROM logistics.shipping_methods WHERE name = 'express'), 'domestic', 12.99, 1.00),
((SELECT id FROM logistics.shipping_methods WHERE name = 'overnight'), 'domestic', 24.99, 2.00),
((SELECT id FROM logistics.shipping_methods WHERE name = 'international'), 'international', 19.99, 3.00);

-- Enable Row Level Security
ALTER TABLE logistics.shipping_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Active shipping methods are viewable by all"
    ON logistics.shipping_methods FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage shipping methods"
    ON logistics.shipping_methods FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 