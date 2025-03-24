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

-- Enable Row Level Security
ALTER TABLE finance.subscription_items ENABLE ROW LEVEL SECURITY;

-- Create policies
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