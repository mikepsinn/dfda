-- Service Types
--
-- Defines types of medical services offered
-- Used for scheduling and service management
--
CREATE TABLE scheduling.service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default service types
INSERT INTO scheduling.service_types (name, description, duration_minutes, is_active) VALUES
('initial_consultation', 'Initial medical consultation', 60, true),
('follow_up', 'Follow-up appointment', 30, true),
('lab_review', 'Laboratory results review', 30, true),
('treatment_session', 'Treatment session', 45, true),
('emergency_consultation', 'Emergency consultation', 60, true);

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