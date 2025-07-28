-- Table: core.profiles

CREATE TABLE core.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    organization_name TEXT,
    contact_name TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('patient', 'doctor', 'sponsor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
