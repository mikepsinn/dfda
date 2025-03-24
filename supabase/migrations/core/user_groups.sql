-- User Groups
--
-- System user groups for role-based access control
-- Defines the main user roles in the system
--
CREATE TABLE core.user_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default user groups
INSERT INTO core.user_groups (name, description) VALUES
('administrators', 'System administrators with full access'),
('staff', 'Staff members with elevated privileges'),
('researchers', 'Research team members'),
('providers', 'Healthcare providers'),
('patients', 'Regular patients/users'); 