-- User Permissions
--
-- System permissions for fine-grained access control
-- Defines individual permissions that can be assigned to user groups
--
CREATE TABLE core.user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default permissions
INSERT INTO core.user_permissions (permission, description) VALUES
('manage_users', 'Can manage user accounts'),
('view_users', 'Can view user profiles'),
('manage_trials', 'Can manage clinical trials'),
('view_trials', 'Can view clinical trial data'),
('manage_medical', 'Can manage medical records'),
('view_medical', 'Can view medical records'),
('manage_commerce', 'Can manage e-commerce operations'),
('view_commerce', 'Can view e-commerce data'),
('manage_scheduling', 'Can manage scheduling'),
('view_scheduling', 'Can view schedules'),
('manage_logistics', 'Can manage logistics'),
('view_logistics', 'Can view logistics data'),
('manage_finances', 'Can manage financial operations'),
('view_finances', 'Can view financial data'),
('manage_oauth2', 'Can manage OAuth2 applications'),
('view_oauth2', 'Can view OAuth2 data'); 