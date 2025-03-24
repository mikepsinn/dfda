-- Wishlists
CREATE TABLE commerce.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE commerce.wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public wishlists are viewable by all"
    ON commerce.wishlists FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own wishlists"
    ON commerce.wishlists FOR ALL
    USING (auth.uid() = user_id); 