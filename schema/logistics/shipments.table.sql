-- Table: logistics.shipments

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
