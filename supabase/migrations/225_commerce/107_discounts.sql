-- Discounts
CREATE TABLE commerce.discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL NOT NULL CHECK (discount_value >= 0),
    minimum_purchase_amount DECIMAL CHECK (minimum_purchase_amount >= 0),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    times_used INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_discount_dates CHECK (end_date IS NULL OR start_date <= end_date)
);

-- Enable Row Level Security
ALTER TABLE commerce.discounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Active discounts are viewable by all"
    ON commerce.discounts FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage discounts"
    ON commerce.discounts FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_discounts'
    )); 