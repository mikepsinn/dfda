'use server'

import { z } from 'zod'
// Correct import based on project structure usage in profiles.ts
import { createClient } from '@/lib/supabase/server' 
// import { cookies } from 'next/headers' // Likely not needed if createClient handles it
import { Database } from '@/lib/database.types'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid' // For generating unique filenames
import slugify from 'slugify' // Import slugify
// Import constants
import { UNIT_IDS } from '@/lib/constants/units'
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories'

// Input schema validation using Zod
const SaveItemInputSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['food', 'treatment', 'other']),
  name: z.string().min(1, 'Name cannot be empty.'),
  details: z.string().optional(),
  // Add product-specific fields from AI analysis
  brand_name: z.string().optional(),
  manufacturer: z.string().optional(),
  upc: z.string().optional(),
})

// Schema for the file part expected in FormData
const FileSchema = z.instanceof(File).refine(
    (file) => file.size > 0, 
    { message: "Image file cannot be empty." }
).refine(
    (file) => file.size <= 5 * 1024 * 1024, // Example: 5MB limit
    { message: "Image file size must be less than 5MB." }
).refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
    { message: "Invalid image file type. Only JPEG, PNG, WEBP, GIF allowed." }
);

// Combine text fields and file for FormData validation (if needed, typically done on client)
// Here, we mainly validate the extracted text fields and assume file is validated on client or here

export type SaveItemInput = z.infer<typeof SaveItemInputSchema>

// Define a more specific return type for success
interface SaveSuccessData {
    globalVariableId: string;
    userVariableId: string;
    productId?: string | null; // Allow null if product upsert fails or doesn't return ID
    patientTreatmentId?: string;
    uploadedFileId?: string; // ID of the record in uploaded_files table
    userVariableImageLinked: boolean; // Indicate if linking succeeded
}

const BUCKET_NAME = 'user_uploads' // Define bucket name constant

export async function saveItemFromImageAction(formData: FormData): Promise<
  { success: true; data: SaveSuccessData } |
  { success: false; error: string }
> {
  // Instantiate the Supabase client correctly
  const supabase = await createClient() 

  // Extract and validate text fields
  const textInput: SaveItemInput = {
    userId: formData.get('userId') as string,
    type: formData.get('type') as 'food' | 'treatment' | 'other',
    name: formData.get('name') as string,
    details: formData.get('details') as string | undefined,
    brand_name: formData.get('brand_name') as string | undefined,
    manufacturer: formData.get('manufacturer') as string | undefined,
    upc: formData.get('upc') as string | undefined,
  }

  const validation = SaveItemInputSchema.safeParse(textInput)
  if (!validation.success) {
    logger.error('Invalid input for saveItemFromImageAction (text fields)', { 
      formDataKeys: Array.from(formData.keys()), 
      parsedInput: textInput,
      errors: validation.error.flatten()
    })
    const errorSummary = Object.entries(validation.error.flatten().fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    return { success: false, error: `Invalid input: ${errorSummary}` }
  }

  // Extract and validate file
  const file = formData.get('image') as File | null;
  const fileValidation = FileSchema.safeParse(file);
  if (!file || !fileValidation.success) {
    logger.error('Invalid file input for saveItemFromImageAction', { 
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        error: fileValidation.success ? 'File is null' : fileValidation.error.flatten()
    })
    return { success: false, error: `Invalid image file: ${fileValidation.success ? 'No file provided' : fileValidation.error.flatten().formErrors.join(', ')}` };
  }

  const { userId, type, name, details, brand_name, manufacturer, upc } = validation.data
  const imageFile = fileValidation.data; // Use validated file

  let finalStoragePath: string | null = null; // Define here to potentially use in catch block

  try {
    // --- 1. Upload Image to Supabase Storage --- 
    const fileExtension = imageFile.name.split('.').pop()?.toLowerCase() || 'unknown'
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    const storagePath = `${userId}/${uniqueFileName}` // Path format based on RLS policy

    logger.info('Attempting to upload image to storage', { userId, storagePath, bucket: BUCKET_NAME })
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, imageFile)

    if (uploadError || !uploadData) {
      logger.error('Failed to upload image to Supabase Storage', { error: uploadError, userId, storagePath })
      throw new Error(`Storage error: ${uploadError?.message || 'Upload failed'}`)
    }

    logger.info('Image uploaded successfully', { path: uploadData.path, storagePathFromInput: storagePath })
    finalStoragePath = uploadData.path; // Use the path returned by Supabase

    // --- 2. Find or Create Global Variable --- 
    // Use constants for category and unit IDs
    const foodCategoryId = VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS // Assuming food fits here
    const treatmentCategoryId = VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS // Assuming treatments fit here
    const otherCategoryId = VARIABLE_CATEGORY_IDS.HEALTH_AND_PHYSIOLOGY // Assuming 'other' maps here, adjust if needed
    const defaultFoodUnitId = UNIT_IDS.GRAM // Default food unit
    const defaultTreatmentUnitId = UNIT_IDS.DIMENSIONLESS // Default treatment unit (e.g., pill, dose) - Adjust if needed
    const defaultOtherUnitId = UNIT_IDS.DIMENSIONLESS // Default 'other' unit - Adjust if needed

    let variableCategoryId: string | null = null
    let defaultUnitId: string | null = null
    if (type === 'food') { variableCategoryId = foodCategoryId; defaultUnitId = defaultFoodUnitId; }
    else if (type === 'treatment') { variableCategoryId = treatmentCategoryId; defaultUnitId = defaultTreatmentUnitId; }
    else { variableCategoryId = otherCategoryId; defaultUnitId = defaultOtherUnitId; }

    // Simplified check: ensure category and unit IDs were resolved from constants
    if (!variableCategoryId || !defaultUnitId) {
      logger.error('Missing Category/Unit IDs from constants', { variableCategoryId, defaultUnitId })
      throw new Error('Configuration error: Could not determine valid variable category or default unit ID from constants.')
    }

    let globalVariableId: string | null = null;
    const trimmedName = name.trim();
    const slugId = slugify(trimmedName, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });

    // Try finding by slugified ID first (more reliable if name changes slightly)
    const { data: existingVarById, error: findByIdError } = await supabase
      .from('global_variables')
      .select('id, name, description')
      .eq('id', slugId)
      .maybeSingle()

    if (findByIdError) throw new Error(`DB error (find GVar by ID): ${findByIdError.message}`);

    if (existingVarById) {
        globalVariableId = existingVarById.id;
        logger.info('Found existing global variable by ID', { id: globalVariableId });
        // Potentially update name/description if different from input
        if (trimmedName !== existingVarById.name || (details && details.trim() !== (existingVarById.description ?? '').trim())) {
             const updatePayload: Partial<Database['public']['Tables']['global_variables']['Update']> = {};
             if (trimmedName !== existingVarById.name) updatePayload.name = trimmedName;
             if (details && details.trim() !== (existingVarById.description ?? '').trim()) updatePayload.description = details.trim();
             
             const { error: updateDetailsError } = await supabase.from('global_variables').update(updatePayload).eq('id', globalVariableId);
             if (updateDetailsError) logger.warn('Failed to update GVar details', { id: globalVariableId, error: updateDetailsError });
        }
    } else {
      // If not found by ID, check by name/category (to catch potential non-slugified or existing with different casing)
      const { data: existingVarByName, error: findByNameError } = await supabase
        .from('global_variables')
        .select('id, description')
        .ilike('name', trimmedName)
        .eq('variable_category_id', variableCategoryId)
        .limit(1)
        .maybeSingle()

      if (findByNameError) throw new Error(`DB error (find GVar by Name): ${findByNameError.message}`);

      if (existingVarByName) {
          globalVariableId = existingVarByName.id;
          logger.info('Found existing global variable by Name', { id: globalVariableId });
          // Update details if needed
          if (details && details.trim() !== (existingVarByName.description ?? '').trim()) {
             const { error: updateDescError } = await supabase.from('global_variables').update({ description: details.trim() }).eq('id', globalVariableId);
             if (updateDescError) logger.warn('Failed to update GVar description (found by name)', { id: globalVariableId, error: updateDescError });
          }
      } else {
          // Create new global variable with slugified ID
          const { data: newVar, error: createError } = await supabase.from('global_variables').insert({
              id: slugId, // Use slugified ID
              name: trimmedName, 
              description: details?.trim(), 
              variable_category_id: variableCategoryId, 
              default_unit_id: defaultUnitId
          }).select('id').single();
          if (createError || !newVar) throw new Error(`DB error (create GVar): ${createError?.message || 'Unknown'}`);
          globalVariableId = newVar.id;
          logger.info('Created new global variable', { id: globalVariableId });
      }
    }

    if (!globalVariableId) throw new Error('Failed to establish global variable reference.');

    // --- 3. Create or Update Product Details --- 
    let productId: string | null = null; // Allow null
    // Determine product type based on input type
    const productType: Database['public']['Enums']['product_type_enum'] = 
        type === 'food' ? 'trackable_item' : 
        type === 'treatment' ? 'trackable_item' : // Assuming treatments are trackable items
        'other'; // Default, adjust as needed

    if (productType === 'trackable_item' || brand_name || manufacturer || upc) { 
      // Only upsert if it's a trackable item or has other product details
      const { data: productData, error: upsertProductError } = await supabase
        .from('products') 
        .upsert({
          global_variable_id: globalVariableId, // Link to global variable
          product_type: productType, // Set the type
          name: trimmedName, // Use the same name for consistency initially
          brand_name: brand_name?.trim(),
          manufacturer: manufacturer?.trim(),
          upc: upc?.trim()
          // id: Will be generated by DB if not existing
        }, { onConflict: 'global_variable_id' }) // Upsert based on the FK
        .select('id') // Select the product's own ID
        .single()

      if (upsertProductError || !productData) {
        logger.warn('Could not save product-specific details', { error: upsertProductError, globalVariableId });
      } else {
        productId = productData.id; // Assign the product's primary key ID
        logger.info('Product details saved/updated', { productId });
      }
    }

    // --- 4. Link Image via uploaded_files Table --- 
    const { data: uploadedFileData, error: insertFileError } = await supabase
      .from('uploaded_files')
      .insert({
        uploader_user_id: userId,
        storage_path: finalStoragePath,
        file_name: imageFile.name,
        mime_type: imageFile.type,
        size_bytes: imageFile.size,
      })
      .select('id')
      .single()

    if (insertFileError || !uploadedFileData) {
      logger.error('Failed to insert uploaded file metadata', { error: insertFileError, storagePath: finalStoragePath })
      // Attempt to clean up the orphaned storage object?
      await supabase.storage.from(BUCKET_NAME).remove([finalStoragePath]);
      logger.warn('Orphaned storage object removed after DB insert failure', { storagePath: finalStoragePath })
      throw new Error(`Database error linking uploaded file: ${insertFileError?.message || 'Insert failed'}`)
    }
    const uploadedFileId = uploadedFileData.id;
    logger.info('Uploaded file metadata saved', { uploadedFileId });

    // --- 5. Find or Create User Variable (Association) ---
    let userVariableId: string | null = null
    const { data: existingUserVar, error: findUserVarError } = await supabase
      .from('user_variables')
      .select('id')
      .eq('user_id', userId)
      .eq('global_variable_id', globalVariableId) // Use non-null globalVariableId
      .maybeSingle();

    if (findUserVarError) {
      logger.error('Error finding user variable', { error: findUserVarError, userId, globalVariableId })
      // Treat as fatal error
      throw new Error(`Database error checking user tracking status: ${findUserVarError.message}`)
    }

    if (existingUserVar) {
        userVariableId = existingUserVar.id;
        logger.info('User already tracking this variable', { userId, globalVariableId, userVariableId })
    } else {
        const { data: newUserVar, error: createUserVarError } = await supabase
        .from('user_variables')
        .insert({
            user_id: userId,
            global_variable_id: globalVariableId, // Use non-null globalVariableId
            preferred_unit_id: defaultUnitId // Set preferred unit initially
        })
        .select('id')
        .single()

        if (createUserVarError || !newUserVar) {
            logger.error('Error creating user variable', { error: createUserVarError, userId, globalVariableId, defaultUnitId })
            throw new Error(`Database error linking item to user: ${createUserVarError?.message || 'Unknown error'}`)
        }
        userVariableId = newUserVar.id
        logger.info('Created user variable association', { userId, globalVariableId, userVariableId })
    }

    // Ensure userVariableId is not null after find/create before proceeding
    if (!userVariableId) {
      logger.error('Failed to find or create user variable association', { userId, globalVariableId });
      throw new Error('Failed to establish user tracking for the item.');
    }

    // --- 6. Link User Variable and Uploaded File --- 
    let userVariableImageLinked = false;
    const { error: linkImageError } = await supabase
      .from('user_variable_images')
      .insert({
          user_variable_id: userVariableId,
          uploaded_file_id: uploadedFileId,
          is_primary: true // Assume first image is primary
      })
      
    if (linkImageError) {
        // If linking fails (e.g., unique constraint violation if file already linked), log warning but proceed
        logger.warn('Failed to link user variable to uploaded image', { 
            error: linkImageError, 
            userVariableId, 
            uploadedFileId 
        });
        // Should we attempt to delete the uploaded_files record and storage object here?
        // Depends on desired transactional behavior. For now, just warn.
    } else {
        userVariableImageLinked = true;
        logger.info('Successfully linked user variable to image', { userVariableId, uploadedFileId });
    }

    // --- 7. Handle Treatment Specific Logic ---
    let patientTreatmentId: string | undefined = undefined // Initialize as undefined
    if (type === 'treatment') {
      // Ensure entry exists in the `treatments` table
      const { error: upsertTreatmentError } = await supabase
        .from('treatments')
        .upsert({ 
            id: globalVariableId, // treatments.id == global_variables.id (non-null)
            // Infer treatment type more robustly if possible from details/AI
            treatment_type: details?.toLowerCase().includes('pill') ? 'medication' : 'unknown' 
            // Add manufacturer if available from details/AI
         }, { onConflict: 'id' })
      
      if(upsertTreatmentError) {
        logger.error('Error upserting treatment record', { error: upsertTreatmentError, globalVariableId })
        // Consider if this should be fatal or warning
        throw new Error(`Database error ensuring treatment record exists: ${upsertTreatmentError.message}`)
      }

      // Add to patient_treatments if not already there 
      const { data: existingPatientTreatment, error: findPatientTreatmentError } = await supabase
        .from('patient_treatments')
        .select('id')
        .eq('patient_id', userId)
        .eq('treatment_id', globalVariableId) // Use non-null globalVariableId
        // Consider status? Only add if not currently active?
        // .eq('status', 'active') 
        .limit(1)
        .maybeSingle();

      if (findPatientTreatmentError) {
          logger.error('Error checking existing patient treatment', { error: findPatientTreatmentError, userId, globalVariableId })
          throw new Error(`Database error checking patient treatment status: ${findPatientTreatmentError.message}`)
      }

      if (!existingPatientTreatment) {
        const { data: newPatientTreatment, error: createPatientTreatmentError } = await supabase
            .from('patient_treatments')
            .insert({
                patient_id: userId,
                treatment_id: globalVariableId, // Use non-null globalVariableId
                user_variable_id: userVariableId, // Guaranteed non-null here
                status: 'active', // Default status
                is_prescribed: false, // Default - user added, not prescribed via system
                patient_notes: details?.trim() // Store trimmed details here maybe?
            })
            .select('id')
            .single()

        if (createPatientTreatmentError || !newPatientTreatment) {
            logger.error('Error creating patient treatment record', { error: createPatientTreatmentError, userId, globalVariableId, userVariableId })
            throw new Error(`Database error adding treatment for patient: ${createPatientTreatmentError?.message || 'Unknown error'}`)
        }
        patientTreatmentId = newPatientTreatment.id // Assign string directly
        logger.info('Created patient treatment record', { userId, globalVariableId, patientTreatmentId })
      } else {
          patientTreatmentId = existingPatientTreatment.id; // Assign string directly
          logger.info('Patient treatment record already exists', { userId, globalVariableId, patientTreatmentId })
          // Optionally update details/notes here if they differ
          if (details) {
              const { error: updateNotesError } = await supabase
                  .from('patient_treatments')
                  .update({ patient_notes: details.trim() })
                  .eq('id', patientTreatmentId);
              if (updateNotesError) {
                  logger.warn('Failed to update notes for existing patient treatment', { id: patientTreatmentId, error: updateNotesError })
                  // Non-fatal
              }
          }
      }
    }

    // Revalidate relevant paths
    revalidatePath('/patient') // Revalidate the main dashboard
    if (type === 'treatment') {
      revalidatePath('/patient/treatments')
    }
    revalidatePath('/patient/photos') // Revalidate the new photos page

    // Construct success data with guaranteed non-null IDs
    const successData: SaveSuccessData = {
        globalVariableId, // Now guaranteed string because of the check above
        userVariableId, // Now guaranteed string
        productId, // Include the product ID if created
        patientTreatmentId, // Remains string | undefined
        uploadedFileId, // Include the file metadata ID
        userVariableImageLinked
    }
    return { success: true, data: successData }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while saving the item.'
    logger.error('Error in saveItemFromImageAction catch block', { 
        errorMessage,
        originalError: error,
        inputData: { userId, type, name, details, brand_name, manufacturer, upc } // Log validated text data on error
    })
    // Attempt to clean up storage if upload succeeded but subsequent DB operations failed
    if (finalStoragePath) {
        logger.info('Attempting cleanup of storage object due to error', { finalStoragePath });
        const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove([finalStoragePath]);
        if (removeError) {
            logger.error('Failed to cleanup storage object after error', { finalStoragePath, removeError });
        } else {
            logger.info('Successfully cleaned up storage object after error', { finalStoragePath });
        }
    }
    return { success: false, error: errorMessage }
  }
} 