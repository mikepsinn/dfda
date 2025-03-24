-- Payment Methods
CREATE TABLE finance.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('credit_card', 'bank_account', 'digital_wallet')),
    provider TEXT NOT NULL,
    account_last4 TEXT NOT NULL,
    expiry_date DATE,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    billing_address_id UUID REFERENCES core.addresses(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE finance.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment methods"
    ON finance.payment_methods FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own payment methods"
    ON finance.payment_methods FOR ALL
    USING (auth.uid() = user_id); 