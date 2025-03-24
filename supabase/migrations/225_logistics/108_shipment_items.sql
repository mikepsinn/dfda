-- Shipment Items
CREATE TABLE logistics.shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES logistics.shipments(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES commerce.order_items(id),
    inventory_id UUID NOT NULL REFERENCES logistics.inventory(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shipment_id, order_item_id)
);

-- Enable Row Level Security
ALTER TABLE logistics.shipment_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own shipment items"
    ON logistics.shipment_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM logistics.shipments s
        JOIN commerce.orders o ON o.id = s.order_id
        WHERE s.id = shipment_id
        AND o.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all shipment items"
    ON logistics.shipment_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Staff can manage shipment items"
    ON logistics.shipment_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 