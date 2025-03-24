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

-- Enable Row Level Security
ALTER TABLE logistics.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
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