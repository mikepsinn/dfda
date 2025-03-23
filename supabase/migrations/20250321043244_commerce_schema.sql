-- =============================================
-- COMMERCE SCHEMA - E-commerce Data
-- =============================================

-- Products
CREATE TABLE commerce.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variable_id UUID NOT NULL REFERENCES medical_ref.global_variables(id) ON DELETE CASCADE,
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

-- Orders
CREATE TABLE commerce.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    total_amount DECIMAL NOT NULL CHECK (total_amount >= 0),
    shipping_amount DECIMAL NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    tax_amount DECIMAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_address_id UUID NOT NULL REFERENCES core.addresses(id),
    billing_address_id UUID NOT NULL REFERENCES core.addresses(id),
    payment_intent_id TEXT,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items
CREATE TABLE commerce.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL NOT NULL CHECK (total_price >= 0),
    discount_amount DECIMAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Wishlists
CREATE TABLE commerce.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist Items
CREATE TABLE commerce.wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_id UUID NOT NULL REFERENCES commerce.wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wishlist_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE commerce.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Products
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

-- Product Images
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

-- Cart Items
CREATE POLICY "Users can view their own cart"
    ON commerce.cart_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart"
    ON commerce.cart_items FOR ALL
    USING (auth.uid() = user_id);

-- Orders
CREATE POLICY "Users can view their own orders"
    ON commerce.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
    ON commerce.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage orders"
    ON commerce.orders FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_orders'
    ));

-- Order Items
CREATE POLICY "Users can view their own order items"
    ON commerce.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM commerce.orders o
        WHERE o.id = order_id
        AND o.user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage order items"
    ON commerce.order_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_orders'
    ));

-- Discounts
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

-- Product Reviews
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

-- Wishlists
CREATE POLICY "Public wishlists are viewable by all"
    ON commerce.wishlists FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own wishlists"
    ON commerce.wishlists FOR ALL
    USING (auth.uid() = user_id);

-- Wishlist Items
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