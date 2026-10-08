import { getUserDb } from '@/lib/db/server';
import { logger } from './logger';
import { UNIT_IDS } from '@/lib/constants/units'; // Needed for fallback
import { uploadUserFile } from '@/lib/storage';

// Define image types needed by uploadAndLinkImages
// const IMAGE_TYPES = ['primary', 'nutrition', 'ingredients', 'upc'] as const;
// export type ImageType = typeof IMAGE_TYPES[number];
export type ImageType = 'primary' | 'nutrition' | 'ingredients' | 'upc';

/**
 * Finds an existing user_variable record or creates a new one,
 * linking a user to a global variable.
 */
export async function findOrCreateUserVariable(
    userId: string,
    globalVariableId: string
): Promise<{ userVariableId: string, defaultUnitId: string }> {
    const db = await getUserDb();
    const existingUserVar = await db.user_variables.findUnique({
      where: { user_id_global_variable_id: { user_id: userId, global_variable_id: globalVariableId } },
      select: { id: true, global_variable_id: true, global_variables: { select: { default_unit_id: true } } }, // Fetch default unit via relationship
    });

    if (existingUserVar) {
        logger.debug('User already tracking this variable', { userId, globalVariableId, userVariableId: existingUserVar.id });
        const defaultUnitId = existingUserVar.global_variables.default_unit_id ?? UNIT_IDS.DIMENSIONLESS; // Fallback
        return { userVariableId: existingUserVar.id, defaultUnitId };
    } else {
        // Fetch the default unit ID from the global variable directly
        const gvData = await db.global_variables.findUnique({
            where: { id: globalVariableId },
            select: { default_unit_id: true },
        });
        if (!gvData) {
            logger.error('DB error fetching GVar default unit', { globalVariableId });
            throw new Error('DB error fetching GVar default unit: Not found');
        }
        const defaultUnitId = gvData.default_unit_id;

        const newUserVar = await db.user_variables.create({
            data: { user_id: userId, global_variable_id: globalVariableId, preferred_unit_id: defaultUnitId },
            select: { id: true },
        });
        logger.info('Created user variable association', { userVariableId: newUserVar.id });
        return { userVariableId: newUserVar.id, defaultUnitId };
    }
}

/**
 * Uploads image files to storage, creates records in uploaded_files,
 * and links them to a user_variable via user_variable_images.
 * `userId` must be the signed-in user: the files are stored in that user's folder.
 */
export async function uploadAndLinkImages(
    userId: string,
    userVariableId: string,
    imageFiles: { type: ImageType; file: File }[],
    // Out param to collect paths for potential cleanup on error in the calling function
    uploadedStoragePaths: string[] 
): Promise<{ type: ImageType; uploadedFileId: string; userVariableImageLinked: boolean }[]> {
    const results: { type: ImageType; uploadedFileId: string; userVariableImageLinked: boolean }[] = [];
    const db = await getUserDb();

    for (const { type, file } of imageFiles) {
        let currentStoragePath: string | null = null;

        try {
            // Call the centralized upload function
            currentStoragePath = await uploadUserFile(userId, file);
            uploadedStoragePaths.push(currentStoragePath); // Still track for potential cleanup

            // Link via uploaded_files Table
            const uploadedFileData = await db.uploaded_files.create({
              data: { uploader_user_id: userId, storage_path: currentStoragePath, file_name: file.name, mime_type: file.type, size_bytes: file.size },
              select: { id: true },
            });
            const uploadedFileId = uploadedFileData.id;
            logger.info('Uploaded file metadata saved', { type, uploadedFileId });

            // Link User Variable and Uploaded File
            let userVariableImageLinked = false;
            try {
                await db.user_variable_images.create({
                  data: { user_variable_id: userVariableId, uploaded_file_id: uploadedFileId, is_primary: type === 'primary' },
                });
                userVariableImageLinked = true;
                logger.info('Successfully linked user variable to image', { type, userVariableId, uploadedFileId });
            } catch (linkImageError) {
                logger.warn('Failed to link user variable to uploaded image', { error: linkImageError, type, userVariableId, uploadedFileId });
                // Non-fatal for now
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