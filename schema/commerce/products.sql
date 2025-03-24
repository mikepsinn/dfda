-- Products
CREATE TABLE commerce.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variable_id UUID NOT NULL REFERENCES reference.variables(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    sku TEXT UNIQUE,
    price DECIMAL NOT NULL CHECK (price >= 0),
    sale_price DECIMAL CHECK (sale_price >= 0),
    sale_start_date TIMESTAMP WITH TIME ZONE,
    sale_end_date TIMESTAMP WITH TIME ZONE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    requires_prescription BOOLEAN DEFAULT FALSE,
    manufacturer TEXT,
    brand TEXT,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_sale_dates CHECK (sale_start_date IS NULL OR sale_end_date IS NULL OR sale_start_date <= sale_end_date),
    CONSTRAINT valid_sale_price CHECK (sale_price IS NULL OR sale_price <= price)
);

-- Enable Row Level Security
ALTER TABLE commerce.products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Active products are viewable by all"
    ON commerce.products FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage products"
    ON commerce.products FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_products'
    )); 