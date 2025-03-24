-- Returns
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

-- Enable Row Level Security
ALTER TABLE logistics.returns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own returns"
    ON logistics.returns FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Staff can view all returns"
    ON logistics.returns FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Users can create returns"
    ON logistics.returns FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can manage returns"
    ON logistics.returns FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 