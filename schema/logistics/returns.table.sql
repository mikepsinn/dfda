-- Table: logistics.returns

CREATE TABLE logistics.returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'received', 'inspected', 'completed', 'rejected')),
    return_reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
