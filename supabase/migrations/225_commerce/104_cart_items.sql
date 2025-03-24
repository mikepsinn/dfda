-- Shopping Cart Items
CREATE TABLE commerce.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE commerce.cart_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cart"
    ON commerce.cart_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart"
    ON commerce.cart_items FOR ALL
    USING (auth.uid() = user_id); 