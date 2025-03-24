-- Service Providers
CREATE TABLE scheduling.service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    title TEXT,
    bio TEXT,
    specialties TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE scheduling.service_providers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Active providers are viewable by all"
    ON scheduling.service_providers FOR SELECT
    USING (is_active = true);

CREATE POLICY "Providers can manage their own profile"
    ON scheduling.service_providers FOR ALL
    USING (auth.uid() = user_id); 