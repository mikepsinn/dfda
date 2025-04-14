CREATE TABLE public.uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL UNIQUE CHECK (char_length(storage_path) > 0), -- e.g., 'user_uploads/user-id/filename.pdf'
    file_name TEXT NOT NULL CHECK (char_length(file_name) > 0),
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.uploaded_files
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE INDEX idx_uploaded_files_uploader_user_id ON public.uploaded_files(uploader_user_id); 