'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import { logger } from '@/lib/logger'

interface FileMetadata {
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number
}

/**
 * Records metadata for a successfully uploaded file.
 * Should only be called *after* a file has been successfully uploaded to storage.
 * @returns The ID of the newly created uploaded_files record, or null on error.
 */
export async function recordUploadMetadata(
  metadata: FileMetadata,
): Promise<string | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    logger.error('Auth error recording upload metadata', { error: authError })
    return null
  }

  const recordToInsert: Database['public']['Tables']['uploaded_files']['Insert'] = {
    uploader_user_id: user.id,
    storage_path: metadata.storage_path,
    file_name: metadata.file_name,
    mime_type: metadata.mime_type,
    size_bytes: metadata.size_bytes,
  }

  const { data, error } = await supabase
    .from('uploaded_files')
    .insert(recordToInsert)
    .select('id')
    .single()

  if (error) {
    logger.error('Error inserting uploaded_files record', { error, record: recordToInsert })
    return null
  }

  logger.info('Successfully recorded file upload metadata', { userId: user.id, fileId: data.id, path: metadata.storage_path })
  return data.id
} 