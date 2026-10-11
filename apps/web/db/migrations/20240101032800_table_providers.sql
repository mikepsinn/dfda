-- Migration: create_providers_table
BEGIN;

CREATE TABLE public.providers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, -- 1-to-1 link to profiles table

    -- Provider Specific Details
    npi_number TEXT UNIQUE,           -- National Provider Identifier (Common in US)
    license_number TEXT,              -- Medical License Number
    license_state TEXT,               -- State/Region of Licensure
    specialty TEXT,                   -- e.g., 'Cardiology', 'General Practice', 'Neurology'
    credentials TEXT,                 -- e.g., 'MD', 'DO', 'NP', 'PA'
    office_address TEXT,
    office_phone TEXT,

    -- Add other provider-specific fields as needed

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_providers_npi_number ON public.providers (npi_number);
CREATE INDEX idx_providers_specialty ON public.providers (specialty);

-- Row Level Security
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow the provider themselves to manage their specific details
CREATE POLICY "Allow provider to manage their own provider details"
    ON public.providers FOR ALL
    USING (auth.uid() = id);

-- Policy: Allow authenticated users to view provider details (adjust as needed for privacy)
CREATE POLICY "Allow authenticated users to view provider details"
    ON public.providers FOR SELECT
    USING (auth.role() = 'authenticated'); -- Use role() check

GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;

-- Comments
COMMENT ON TABLE public.providers IS 'Stores additional details specific to users with the provider role.';
COMMENT ON COLUMN public.providers.id IS 'Links one-to-one with the profiles table.';
COMMENT ON COLUMN public.providers.npi_number IS 'National Provider Identifier (US).';
COMMENT ON COLUMN public.providers.specialty IS 'Medical specialty of the provider.';

-- Trigger for updated_at (Assuming function exists)
CREATE TRIGGER handle_providers_updated_at
    BEFORE UPDATE ON public.providers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

COMMIT; 