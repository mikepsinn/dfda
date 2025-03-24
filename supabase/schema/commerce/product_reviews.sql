-- Product Reviews
CREATE TABLE commerce.product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE commerce.product_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Approved reviews are viewable by all"
    ON commerce.product_reviews FOR SELECT
    USING (is_approved = true);

CREATE POLICY "Users can manage their own reviews"
    ON commerce.product_reviews FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
    ON commerce.product_reviews FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_reviews'
    )); 