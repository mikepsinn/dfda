-- Shipping Methods
CREATE TABLE logistics.shipping_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    carrier TEXT NOT NULL,
    service_code TEXT,
    estimated_days INTEGER,
    tracking_url_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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