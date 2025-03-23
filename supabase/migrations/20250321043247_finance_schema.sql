-- =============================================
-- FINANCE SCHEMA - Financial Data
-- =============================================

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

-- Transactions
CREATE TABLE finance.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'credit', 'debit')),
    amount DECIMAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method_id UUID REFERENCES finance.payment_methods(id),
    reference_type TEXT,
    reference_id UUID,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices
CREATE TABLE finance.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    amount DECIMAL NOT NULL CHECK (amount >= 0),
    tax_amount DECIMAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL NOT NULL CHECK (total_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'void', 'cancelled')),
    due_date DATE,
    paid_date DATE,
    billing_address_id UUID REFERENCES core.addresses(id),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE finance.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES finance.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL NOT NULL CHECK (unit_price >= 0),
    tax_rate DECIMAL NOT NULL DEFAULT 0 CHECK (tax_rate >= 0),
    amount DECIMAL NOT NULL CHECK (amount >= 0),
    tax_amount DECIMAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL NOT NULL CHECK (total_amount >= 0),
    reference_type TEXT,
    reference_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
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

-- Subscription Items
CREATE TABLE finance.subscription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES finance.subscriptions(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL NOT NULL CHECK (unit_price >= 0),
    amount DECIMAL NOT NULL CHECK (amount >= 0),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credits
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
ALTER TABLE finance.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Payment Methods
CREATE POLICY "Users can view their own payment methods"
    ON finance.payment_methods FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own payment methods"
    ON finance.payment_methods FOR ALL
    USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view their own transactions"
    ON finance.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all transactions"
    ON finance.transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage transactions"
    ON finance.transactions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    ));

-- Invoices
CREATE POLICY "Users can view their own invoices"
    ON finance.invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all invoices"
    ON finance.invoices FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage invoices"
    ON finance.invoices FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    ));

-- Invoice Items
CREATE POLICY "Users can view their own invoice items"
    ON finance.invoice_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM finance.invoices i
        WHERE i.id = invoice_id
        AND i.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all invoice items"
    ON finance.invoice_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage invoice items"
    ON finance.invoice_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    ));

-- Subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON finance.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all subscriptions"
    ON finance.subscriptions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage subscriptions"
    ON finance.subscriptions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    ));

-- Subscription Items
CREATE POLICY "Users can view their own subscription items"
    ON finance.subscription_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM finance.subscriptions s
        WHERE s.id = subscription_id
        AND s.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all subscription items"
    ON finance.subscription_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage subscription items"
    ON finance.subscription_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    ));

-- Credits
CREATE POLICY "Users can view their own credits"
    ON finance.credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all credits"
    ON finance.credits FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage credits"
    ON finance.credits FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    ));

-- Credit Transactions
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