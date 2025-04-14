DROP POLICY IF EXISTS "Allow uploader full control over their files" ON public.uploaded_files;
CREATE POLICY "Allow uploader full control over their files" ON public.uploaded_files
  FOR ALL
  USING (auth.uid() = uploader_user_id)
  WITH CHECK (auth.uid() = uploader_user_id);

-- Add other policies later if needed (e.g., allow provider read access based on form submissions) 