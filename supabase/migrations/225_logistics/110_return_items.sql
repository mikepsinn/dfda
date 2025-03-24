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
ALTER TABLE logistics.return_items ENABLE ROW LEVEL SECURITY;

-- Create policies
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