'use server'

import { getServerUser } from '@/lib/server-auth'
import { getUserDb } from '@/lib/db/server'
import { logger } from '@/lib/logger'
import {
  MAX_UPLOAD_BYTES,
  createUserUploadUrl,
  deleteStoredFiles,
  getStoredFileInfo,
  isUserFileKey,
} from '@/lib/storage'

/**
 * Returns a signed URL that lets the browser upload one file into the
 * signed-in user's storage folder. After the upload, call recordUploadMetadata.
 */
export async function createUploadUrlAction(file: {
  name: string
  type: string
  size: number
}): Promise<{ storagePath: string; uploadUrl: string } | { error: string }> {
  const user = await getServerUser()
  if (!user) {
    return { error: 'Sign in to upload files.' }
  }
  if (!(file.size > 0) || file.size > MAX_UPLOAD_BYTES) {
    return { error: `Files must be smaller than ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.` }
  }

  try {
    const { key, url } = await createUserUploadUrl(user.id, file)
    return { storagePath: key, uploadUrl: url }
  } catch (error) {
    logger.error('Could not create an upload URL', { userId: user.id, error })
    return { error: 'Could not prepare the upload.' }
  }
}

/**
 * Records a file that the browser uploaded with a URL from createUploadUrlAction.
 * The path must be in the signed-in user's folder. Size and type come from
 * storage, not from the browser.
 * @returns The ID of the new uploaded_files record, or null on error.
 */
export async function recordUploadMetadata(metadata: {
  storage_path: string
  file_name: string
}): Promise<string | null> {
  const user = await getServerUser()
  if (!user) {
    logger.error('No signed-in user while recording upload metadata')
    return null
  }

  const path = metadata.storage_path
  if (!isUserFileKey(user.id, path)) {
    logger.warn('Rejected an upload path outside the user folder', { userId: user.id, path })
    return null
  }

  const info = await getStoredFileInfo(path).catch((error) => {
    logger.error('Could not read uploaded file information', { userId: user.id, path, error })
    return null
  })
  if (!info) {
    logger.error('Uploaded file not found in storage', { userId: user.id, path })
    return null
  }
  if (info.size > MAX_UPLOAD_BYTES) {
    logger.warn('Uploaded file is larger than allowed', { userId: user.id, path, size: info.size })
    await deleteStoredFiles([path])
    return null
  }

  try {
    const db = await getUserDb()
    const record = await db.uploaded_files.create({
      data: {
        uploader_user_id: user.id,
        storage_path: path,
        file_name: metadata.file_name,
        mime_type: info.contentType,
        size_bytes: info.size,
      },
      select: { id: true },
    })
    logger.info('Recorded file upload metadata', { userId: user.id, fileId: record.id, path })
    return record.id
  } catch (error) {
    logger.error('Error inserting uploaded_files record', { userId: user.id, path, error })
    await deleteStoredFiles([path])
    return null
  }
}
