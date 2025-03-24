-- Wishlist Items
CREATE TABLE commerce.wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_id UUID NOT NULL REFERENCES commerce.wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wishlist_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE commerce.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Wishlist items are viewable with wishlist"
    ON commerce.wishlist_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM commerce.wishlists w
        WHERE w.id = wishlist_id
        AND (w.is_public = true OR w.user_id = auth.uid())
    ));

CREATE POLICY "Users can manage their own wishlist items"
    ON commerce.wishlist_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM commerce.wishlists w
        WHERE w.id = wishlist_id
        AND w.user_id = auth.uid()
    )); 