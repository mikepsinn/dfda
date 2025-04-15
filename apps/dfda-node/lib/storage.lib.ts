import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Database } from './database.types';
import { logger } from './logger';
import { BUCKET_NAME } from './constants/storage';

// Define the resolved Supabase client type here or import from a shared types file
type ResolvedSupabaseClient = SupabaseClient<Database, "public">;

/**
 * Uploads a single file to the designated user storage bucket.
 * Generates a unique file path.
 */
export async function uploadFile(
    supabase: ResolvedSupabaseClient,
    userId: string,
    file: File
): Promise<string> { // Returns storagePath on success
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const storagePath = `${userId}/${uniqueFileName}`;

    logger.info('Attempting to upload file to storage', { userId, fileName: file.name, storagePath });
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file);

    if (uploadError || !uploadData) {
        logger.error('Storage upload failed', { userId, fileName: file.name, storagePath, error: uploadError });
        throw new Error(`Storage upload error for ${file.name}: ${uploadError?.message || 'Upload failed'}`);
    }

    logger.info('File uploaded successfully to storage', { userId, storagePath: uploadData.path });
    return uploadData.path; // Return the actual path confirmed by Supabase
}

/**
 * Deletes multiple files from the designated storage bucket.
 */
export async function deleteFiles(
    supabase: ResolvedSupabaseClient,
    paths: string[]
): Promise<void> {
    if (paths.length === 0) {
        return; // Nothing to delete
    }
    logger.warn('Attempting to delete storage objects', { paths });
    const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(paths);

    if (removeError) {
        // Log the error but don't throw, as this is often used in cleanup scenarios
        logger.error('Failed to delete storage objects', { paths, removeError });
    } else {
        logger.info('Successfully deleted storage objects', { paths });
    }
} 