-- Product Images
CREATE TABLE commerce.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, url)
);

-- Enable Row Level Security
ALTER TABLE commerce.product_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Product images are viewable by all"
    ON commerce.product_images FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM commerce.products p
        WHERE p.id = product_id
        AND p.is_active = true
    ));

CREATE POLICY "Admins can manage product images"
    ON commerce.product_images FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_products'
    )); 