-- Migration: Create global_variable_synonyms table

CREATE TABLE public.global_variable_synonyms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    global_variable_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT global_variable_synonyms_global_variable_id_fkey FOREIGN KEY (global_variable_id)
        REFERENCES public.global_variables (id) ON DELETE CASCADE,

    -- Optional: Ensure a synonym is unique for a given global variable
    CONSTRAINT global_variable_synonyms_global_variable_id_name_key UNIQUE (global_variable_id, name)
);

-- Add comments to the table and columns
COMMENT ON TABLE public.global_variable_synonyms IS 'Stores synonyms for global variables to aid searching.';
COMMENT ON COLUMN public.global_variable_synonyms.global_variable_id IS 'Foreign key to the global_variables table.';
COMMENT ON COLUMN public.global_variable_synonyms.name IS 'A synonym for the global variable.';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.global_variable_synonyms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.global_variable_synonyms TO service_role;
-- Add other roles as needed

-- Enable RLS
ALTER TABLE public.global_variable_synonyms ENABLE ROW LEVEL SECURITY;

-- Optional: Create an index for faster lookups by name (useful for search)
CREATE INDEX IF NOT EXISTS idx_global_variable_synonyms_name ON public.global_variable_synonyms USING gin (name gin_trgm_ops);

-- Optional: Create an index for faster lookups by global_variable_id
CREATE INDEX IF NOT EXISTS idx_global_variable_synonyms_global_variable_id ON public.global_variable_synonyms(global_variable_id);

-- Trigger for automatically updating the updated_at column
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.global_variable_synonyms
FOR EACH ROW
EXECUTE FUNCTION moddatetime (updated_at); 