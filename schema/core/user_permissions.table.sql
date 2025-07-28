-- Table: core.user_permissions

CREATE TABLE core.user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
