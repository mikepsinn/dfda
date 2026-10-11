-- Creates the RLS policy to allow authenticated users to read/list files
-- within their own user ID folder in the specified bucket.
-- Assumes files are stored with a path like '{user_id}/{file_name}'

CREATE POLICY "allow_owner_read_user_uploads"
ON storage.objects FOR SELECT TO authenticated
USING ( bucket_id = 'user_uploads' AND auth.uid() = (storage.foldername(name))[1]::uuid ); 