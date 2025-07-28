import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { logger } from './logger';
// import { v4 as uuidv4 } from 'uuid'; // REMOVED UNUSED
import { UNIT_IDS } from '@/lib/constants/units'; // Needed for fallback
// import { BUCKET_NAME } from '@/lib/constants/storage'; // REMOVED UNUSED
import { uploadFile } from './storage.lib'; // Import the new upload function

// Define the resolved Supabase client type here or import from a shared types file
type ResolvedSupabaseClient = SupabaseClient<Database, "public">;

// Define image types needed by uploadAndLinkImages
// const IMAGE_TYPES = ['primary', 'nutrition', 'ingredients', 'upc'] as const;
// export type ImageType = typeof IMAGE_TYPES[number];
export type ImageType = 'primary' | 'nutrition' | 'ingredients' | 'upc';

/**
 * Finds an existing user_variable record or creates a new one,
 * linking a user to a global variable.
 */
export async function findOrCreateUserVariable(
    supabase: ResolvedSupabaseClient,
    userId: string,
    globalVariableId: string
): Promise<{ userVariableId: string, defaultUnitId: string }> {
    const { data: existingUserVar, error: findError } = await supabase
      .from('user_variables')
      .select('id, global_variable_id, global_variables(default_unit_id)') // Fetch default unit via relationship
      .eq('user_id', userId)
      .eq('global_variable_id', globalVariableId)
      .maybeSingle();

    if (findError) {
        logger.error('DB error checking user_variables', { userId, globalVariableId, error: findError });
        throw new Error(`DB error checking user_variables: ${findError.message}`);
    }

    if (existingUserVar) {
        logger.debug('User already tracking this variable', { userId, globalVariableId, userVariableId: existingUserVar.id });
        const defaultUnitId = existingUserVar.global_variables?.default_unit_id ?? UNIT_IDS.DIMENSIONLESS; // Fallback
        return { userVariableId: existingUserVar.id, defaultUnitId };
    } else {
        // Fetch the default unit ID from the global variable directly
        const { data: gvData, error: gvError } = await supabase.from('global_variables').select('default_unit_id').eq('id', globalVariableId).single();
        if (gvError || !gvData) {
            logger.error('DB error fetching GVar default unit', { globalVariableId, error: gvError });
            throw new Error(`DB error fetching GVar default unit: ${gvError?.message || 'Not found'}`);
        }
        const defaultUnitId = gvData.default_unit_id;

        const { data: newUserVar, error: createError } = await supabase
            .from('user_variables')
            .insert({ user_id: userId, global_variable_id: globalVariableId, preferred_unit_id: defaultUnitId })
            .select('id')
            .single();

        if (createError || !newUserVar) {
            logger.error('DB error creating user_variables', { userId, globalVariableId, error: createError });
            throw new Error(`DB error creating user_variables: ${createError?.message || 'Insert failed'}`);
        }
        logger.info('Created user variable association', { userVariableId: newUserVar.id });
        return { userVariableId: newUserVar.id, defaultUnitId };
    }
}

/**
 * Uploads image files to storage, creates records in uploaded_files,
 * and links them to a user_variable via user_variable_images.
 */
export async function uploadAndLinkImages(
    supabase: ResolvedSupabaseClient,
    userId: string,
    userVariableId: string,
    imageFiles: { type: ImageType; file: File }[],
    // Out param to collect paths for potential cleanup on error in the calling function
    uploadedStoragePaths: string[] 
): Promise<{ type: ImageType; uploadedFileId: string; userVariableImageLinked: boolean }[]> {
    const results: { type: ImageType; uploadedFileId: string; userVariableImageLinked: boolean }[] = [];

    for (const { type, file } of imageFiles) {
        let currentStoragePath: string | null = null;

        try {
            // Call the centralized upload function
            currentStoragePath = await uploadFile(supabase, userId, file);
            uploadedStoragePaths.push(currentStoragePath); // Still track for potential cleanup

            // Link via uploaded_files Table
            const { data: uploadedFileData, error: insertFileError } = await supabase
              .from('uploaded_files')
              .insert({ uploader_user_id: userId, storage_path: currentStoragePath, file_name: file.name, mime_type: file.type, size_bytes: file.size })
              .select('id')
              .single();
            
            if (insertFileError || !uploadedFileData) throw new Error(`DB error inserting uploaded_files record: ${insertFileError?.message || 'Insert failed'}`);
            const uploadedFileId = uploadedFileData.id;
            logger.info('Uploaded file metadata saved', { type, uploadedFileId });

            // Link User Variable and Uploaded File
            let userVariableImageLinked = false;
            const { error: linkImageError } = await supabase
              .from('user_variable_images')
              .insert({ user_variable_id: userVariableId, uploaded_file_id: uploadedFileId, is_primary: type === 'primary' });
      
            if (linkImageError) {
                logger.warn('Failed to link user variable to uploaded image', { error: linkImageError, type, userVariableId, uploadedFileId });
                // Non-fatal for now
            } else {
                userVariableImageLinked = true;
                logger.info('Successfully linked user variable to image', { type, userVariableId, uploadedFileId });
            }
            results.push({ type, uploadedFileId, userVariableImageLinked });

        } catch (error) {
             const errMsg = error instanceof Error ? error.message : 'Unknown error';
             logger.error(`Error processing image type ${type}`, { error: errMsg, currentStoragePath });
             // Don't re-throw, allow other images to process. Add partial failure info?
             // For simplicity, just log and continue
        }
    }
    return results;
} 