-- Table: commerce.orders

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
