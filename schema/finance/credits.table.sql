-- Table: finance.credits

CREATE TABLE finance.credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    credit_type TEXT NOT NULL CHECK (credit_type IN ('refund', 'promotion', 'compensation')),
    status TEXT NOT NULL CHECK (status IN ('active', 'used', 'expired')),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
