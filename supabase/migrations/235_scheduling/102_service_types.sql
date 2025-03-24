-- Service Types
CREATE TABLE scheduling.service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL CHECK (duration > 0), -- in minutes
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE scheduling.service_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service types are viewable by all"
    ON scheduling.service_types FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage service types"
    ON scheduling.service_types FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_scheduling'
    )); 