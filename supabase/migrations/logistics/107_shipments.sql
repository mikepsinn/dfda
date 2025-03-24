-- Shipments
CREATE TABLE logistics.shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES logistics.warehouses(id),
    shipping_method_id UUID NOT NULL REFERENCES logistics.shipping_methods(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'picked', 'packed', 'shipped', 'delivered', 'cancelled')),
    tracking_number TEXT,
    shipping_label_url TEXT,
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE logistics.shipments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own shipments"
    ON logistics.shipments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM commerce.orders o
        WHERE o.id = order_id
        AND o.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all shipments"
    ON logistics.shipments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Staff can manage shipments"
    ON logistics.shipments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 