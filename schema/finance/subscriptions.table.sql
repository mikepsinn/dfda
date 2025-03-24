-- Table: finance.subscriptions

CREATE TABLE finance.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    amount DECIMAL NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    payment_method_id UUID REFERENCES finance.payment_methods(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_subscription_dates CHECK (
        start_date <= end_date
        AND (next_billing_date IS NULL OR next_billing_date >= start_date)
    )
);
