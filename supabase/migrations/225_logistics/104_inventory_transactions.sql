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

-- Enable Row Level Security
ALTER TABLE logistics.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
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