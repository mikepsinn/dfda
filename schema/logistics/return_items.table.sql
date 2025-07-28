-- Table: logistics.return_items

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
