-- Table: personal.user_documents

CREATE TABLE personal.user_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50),
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size INTEGER,
    document_date TIMESTAMP WITH TIME ZONE,
    provider_name TEXT,
    facility_name TEXT,
    tags TEXT[],
    notes TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
