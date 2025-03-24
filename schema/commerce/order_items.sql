-- Order Items
CREATE TABLE commerce.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL NOT NULL CHECK (total_price >= 0),
    discount_amount DECIMAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE commerce.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own order items"
    ON commerce.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM commerce.orders o
        WHERE o.id = order_id
        AND o.user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage order items"
    ON commerce.order_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_orders'
    )); 