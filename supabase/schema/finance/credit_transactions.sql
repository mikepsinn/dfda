-- Credit Transactions
CREATE TABLE finance.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_id UUID NOT NULL REFERENCES finance.credits(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL CHECK (amount >= 0),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('apply', 'refund')),
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE finance.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own credit transactions"
    ON finance.credit_transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM finance.credits c
        WHERE c.id = credit_id
        AND c.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all credit transactions"
    ON finance.credit_transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage credit transactions"
    ON finance.credit_transactions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    )); 