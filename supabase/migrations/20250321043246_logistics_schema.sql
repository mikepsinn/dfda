-- =============================================
-- LOGISTICS SCHEMA - Shipping and Logistics
-- =============================================

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

-- Inventory
CREATE TABLE logistics.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES logistics.warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER,
    reorder_quantity INTEGER,
    bin_location TEXT,
    last_count_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(warehouse_id, product_id),
    CONSTRAINT valid_quantities CHECK (
        quantity >= 0 AND
        reserved_quantity >= 0 AND
        reserved_quantity <= quantity
    )
);

-- Inventory Transactions
CREATE TABLE logistics.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID NOT NULL REFERENCES logistics.inventory(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receipt', 'shipment', 'adjustment', 'transfer', 'return')),
    quantity INTEGER NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    performed_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Shipping Rates
CREATE TABLE logistics.shipping_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_method_id UUID NOT NULL REFERENCES logistics.shipping_methods(id) ON DELETE CASCADE,
    min_weight DECIMAL,
    max_weight DECIMAL,
    min_total DECIMAL,
    max_total DECIMAL,
    base_rate DECIMAL NOT NULL CHECK (base_rate >= 0),
    per_item_rate DECIMAL NOT NULL DEFAULT 0 CHECK (per_item_rate >= 0),
    per_weight_rate DECIMAL NOT NULL DEFAULT 0 CHECK (per_weight_rate >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_weight_range CHECK (min_weight IS NULL OR max_weight IS NULL OR min_weight <= max_weight),
    CONSTRAINT valid_total_range CHECK (min_total IS NULL OR max_total IS NULL OR min_total <= max_total)
);

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

-- Returns
CREATE TABLE logistics.returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'received', 'inspected', 'completed', 'rejected')),
    return_reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Return Items
CREATE TABLE logistics.return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES logistics.returns(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES commerce.order_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'used', 'damaged')),
    reason_details TEXT,
    refund_amount DECIMAL CHECK (refund_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(return_id, order_item_id)
);

-- Enable Row Level Security
ALTER TABLE logistics.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics.shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics.return_items ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Warehouses
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

-- Inventory
CREATE POLICY "Inventory is viewable by staff"
    ON logistics.inventory FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Admins can manage inventory"
    ON logistics.inventory FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    ));

-- Inventory Transactions
CREATE POLICY "Transactions are viewable by staff"
    ON logistics.inventory_transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Staff can create transactions"
    ON logistics.inventory_transactions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    ));

-- Shipping Methods
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

-- Shipping Rates
CREATE POLICY "Shipping rates are viewable by all"
    ON logistics.shipping_rates FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage shipping rates"
    ON logistics.shipping_rates FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    ));

-- Shipments
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

-- Shipment Items
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

-- Returns
CREATE POLICY "Users can view their own returns"
    ON logistics.returns FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Staff can view all returns"
    ON logistics.returns FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Users can create returns"
    ON logistics.returns FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can manage returns"
    ON logistics.returns FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    ));

-- Return Items
CREATE POLICY "Users can view their own return items"
    ON logistics.return_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM logistics.returns r
        WHERE r.id = return_id
        AND r.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all return items"
    ON logistics.return_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Staff can manage return items"
    ON logistics.return_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 