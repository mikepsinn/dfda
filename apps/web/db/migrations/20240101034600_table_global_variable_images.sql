-- migrations/xxxxxxxxxxxxxx_create_user_variable_images_table.sql

-- Create the table to link user-specific variables to specific uploaded images
CREATE TABLE public.user_variable_images (
    user_variable_id uuid NOT NULL REFERENCES public.user_variables(id) ON DELETE CASCADE,
    uploaded_file_id uuid NOT NULL REFERENCES public.uploaded_files(id) ON DELETE CASCADE,
    is_primary boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Composite primary key
    PRIMARY KEY (user_variable_id, uploaded_file_id)
);

-- Add unique constraint to prevent linking the same file multiple times to different user variables (undesirable)
ALTER TABLE public.user_variable_images ADD CONSTRAINT user_variable_images_uploaded_file_id_unique UNIQUE (uploaded_file_id);

-- Optional: Add constraint to ensure only one primary image per user variable (More complex, requires function/trigger or deferrable constraint)
-- CREATE UNIQUE INDEX idx_user_variable_images_one_primary ON public.user_variable_images (user_variable_id) WHERE is_primary;

-- Add indexes for foreign keys
CREATE INDEX idx_user_variable_images_user_variable_id ON public.user_variable_images(user_variable_id);
-- Index on uploaded_file_id is covered by the unique constraint/PK

-- Enable Row Level Security
ALTER TABLE public.user_variable_images ENABLE ROW LEVEL SECURITY;

-- Grant access to roles (adjust roles as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_variable_images TO authenticated;

-- Policies for RLS
-- Allow users read/write access if they own the associated user_variable
-- (Ownership of user_variable implies ownership of the intent to link the image)
CREATE POLICY "Allow full access for user variable owner" ON public.user_variable_images
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_variables uv
            WHERE uv.id = user_variable_images.user_variable_id AND uv.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.user_variables uv
            WHERE uv.id = user_variable_images.user_variable_id AND uv.user_id = auth.uid()
        )
        -- Also ensure they own the file they are trying to link (important for INSERT/UPDATE)
        AND EXISTS (
            SELECT 1
            FROM public.uploaded_files uf
            WHERE uf.id = user_variable_images.uploaded_file_id AND uf.uploader_user_id = auth.uid()
        )
    ); 