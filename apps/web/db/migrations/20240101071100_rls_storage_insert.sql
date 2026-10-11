-- Creates the RLS policy to allow authenticated users to upload files
-- into a folder named with their own user ID within the specified bucket.
-- Assumes files are uploaded with a path like '{user_id}/{file_name}'

CREATE POLICY "allow_authenticated_uploads_user_uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'user_uploads' AND auth.uid() = (storage.foldername(name))[1]::uuid ); 