-- Migration: create_research_partners_table
BEGIN;

CREATE TABLE public.research_partners (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, -- 1-to-1 link to profiles table

    -- Research Partner Specific Details
    institution_name TEXT NOT NULL,
    department TEXT,
    website_url TEXT,
    contact_email TEXT,       -- Specific research contact email, might differ from profile email
    research_focus_areas TEXT[], -- Array of keywords or areas
    is_institution BOOLEAN NOT NULL DEFAULT FALSE, -- Differentiates individual researchers vs institutions using a profile

    -- Add other research-partner-specific fields as needed

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_research_partners_institution_name ON public.research_partners (institution_name);
CREATE INDEX idx_research_partners_focus_areas ON public.research_partners USING gin (research_focus_areas); -- GIN index for array search

-- Row Level Security
ALTER TABLE public.research_partners ENABLE ROW LEVEL SECURITY;

-- Policy: Allow the research partner themselves to manage their specific details
CREATE POLICY "Allow research partner to manage their own details"
    ON public.research_partners FOR ALL
    USING (auth.uid() = id);

-- Policy: Allow authenticated users to view research partner details (adjust as needed)
CREATE POLICY "Allow authenticated users to view research partner details"
    ON public.research_partners FOR SELECT
    USING (auth.role() = 'authenticated'); -- Use role() check

GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_partners TO authenticated;

-- Comments
COMMENT ON TABLE public.research_partners IS 'Stores additional details specific to users/entities with the research-partner role.';
COMMENT ON COLUMN public.research_partners.id IS 'Links one-to-one with the profiles table.';
COMMENT ON COLUMN public.research_partners.institution_name IS 'The name of the research institution or company.';
COMMENT ON COLUMN public.research_partners.research_focus_areas IS 'Keywords describing research interests.';

-- Trigger for updated_at (Assuming function exists)
CREATE TRIGGER handle_research_partners_updated_at
    BEFORE UPDATE ON public.research_partners
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

COMMIT; 