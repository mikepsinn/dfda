-- Warehouses
CREATE TABLE logistics.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address_id UUID NOT NULL REFERENCES core.addresses(id),
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE logistics.warehouses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Active warehouses are viewable by staff"
    ON logistics.warehouses FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Admins can manage warehouses"
    ON logistics.warehouses FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 