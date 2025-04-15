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
import { SupabaseClient } from '@supabase/supabase-js' // Import SupabaseClient type

// Define image types expected from the frontend
const IMAGE_TYPES = ['primary', 'nutrition', 'ingredients', 'upc'] as const;
type ImageType = typeof IMAGE_TYPES[number];

// --- Zod Schemas for Input Validation ---

// Schema for individual ingredients (consistent with analyze-image.ts)
const IngredientInputSchema = z.object({
  name: z.string().min(1, "Ingredient name cannot be empty."),
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
});

// Helper to safely parse JSON strings from FormData
const JsonStringSchema = <T extends z.ZodTypeAny>(schema: T) => 
  z.string().transform((str, ctx) => {
    try {
      const parsed = JSON.parse(str);
      const result = schema.safeParse(parsed);
      if (!result.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid JSON structure for ${schema.description || 'array/object'}. Details: ${result.error.message}` });
        return z.NEVER;
      }
      return result.data;
    } catch (e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON string" });
      return z.NEVER;
    }
  });

// Input schema validation directly from FormData
const SaveItemInputSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['food', 'treatment', 'other']),
  name: z.string().min(1, 'Name cannot be empty.'),
  details: z.string().optional(),
  brand: z.string().optional(), // Renamed from brand_name for consistency
  upc: z.string().optional(),
  
  // Food specific fields (optional)
  servingSize_quantity: z.preprocess(val => val ? Number(val) : null, z.number().nullable().optional()),
  servingSize_unit: z.string().optional(),
  calories_per_serving: z.preprocess(val => val ? Number(val) : null, z.number().nullable().optional()),
  fat_per_serving: z.preprocess(val => val ? Number(val) : null, z.number().nullable().optional()),
  protein_per_serving: z.preprocess(val => val ? Number(val) : null, z.number().nullable().optional()),
  carbs_per_serving: z.preprocess(val => val ? Number(val) : null, z.number().nullable().optional()),
  // Use the JSON helper for ingredient arrays
  ingredients: JsonStringSchema(z.array(IngredientInputSchema)).optional(), 

  // Treatment specific fields (optional)
  dosage_form: z.string().optional(),
  dosage_instructions: z.string().optional(),
  active_ingredients: JsonStringSchema(z.array(IngredientInputSchema)).optional(),
  inactive_ingredients: JsonStringSchema(z.array(IngredientInputSchema)).optional(),

  // Manufacturer field from old schema - keep or remove? Plan didn't mention it for form.
  // Let's keep it simple and remove it for now. Can be added back if needed.
  // manufacturer: z.string().optional(), 
});

// Schema for a single image file
const FileSchema = z.instanceof(File).refine(
    (file) => file.size > 0, 
    { message: "Image file cannot be empty." }
).refine(
    (file) => file.size <= 5 * 1024 * 1024, // 5MB limit
    { message: "Image file size must be less than 5MB." }
).refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
    { message: "Invalid image file type. Only JPEG, PNG, WEBP, GIF allowed." }
);

// Type for validated input data
export type SaveItemInput = z.infer<typeof SaveItemInputSchema>

// Type for ingredient data used in DB operations
type IngredientInfo = z.infer<typeof IngredientInputSchema> & { global_variable_id?: string; unit_id?: string | null };

// Define a more specific return type for success, including potentially multiple file IDs
interface SaveSuccessData {
    globalVariableId: string;
    userVariableId: string;
    productId?: string | null;
    foodDetailsId?: string; // PK is global_variable_id
    itemIngredientIds?: string[]; // Array of created item_ingredient IDs
    uploadedFilesInfo?: { type: ImageType; uploadedFileId: string; userVariableImageLinked: boolean }[];
    patientTreatmentId?: string; // Add missing field
}

const BUCKET_NAME = 'user_uploads'; // Define bucket name constant
const INGREDIENT_CATEGORY_ID = VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS; // Use Intake/Interventions for ingredients
const DEFAULT_INGREDIENT_UNIT_ID = UNIT_IDS.DIMENSIONLESS; // Default unit for ingredients if not specified

export async function saveItemFromImageAction(formData: FormData): Promise<
  { success: true; data: SaveSuccessData } |
  { success: false; error: string }
> {
  const supabase = await createClient();

  // 1. Extract and Validate Text/JSON Fields
  const inputData: Record<string, any> = {};
  Object.keys(SaveItemInputSchema.shape).forEach((key) => {
    const value = formData.get(key as string);
    if (value !== null) {
      inputData[key as string] = value;
    }
  });

  const validation = SaveItemInputSchema.safeParse(inputData);

  if (!validation.success) {
    logger.error('Invalid input for saveItemFromImageAction', {
      formDataKeys: Array.from(formData.keys()),
      parsedInput: inputData,
      errors: validation.error.flatten()
    });
    const errorSummary = Object.entries(validation.error.flatten().fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    // Add formErrors if present
    const formErrors = validation.error.flatten().formErrors.join('; ')
    return { success: false, error: `Invalid input: ${errorSummary}${formErrors ? "; " + formErrors : ""}` };
  }

  const validatedData = validation.data;
  const { userId, type, name } = validatedData;

  // 2. Extract and Validate Image Files
  const imageFilesToUpload: { type: ImageType; file: File }[] = [];
  for (const imageType of IMAGE_TYPES) {
    const file = formData.get(`image_${imageType}`) as File | null;
    if (file && file.size > 0) {
      const fileValidation = FileSchema.safeParse(file);
      if (!fileValidation.success) {
        const errorMsg = `Invalid file for image_${imageType}: ${fileValidation.error.flatten().formErrors.join(', ')}`;
        logger.error(errorMsg, { fileName: file.name, fileSize: file.size, fileType: file.type });
        return { success: false, error: errorMsg };
      }
      imageFilesToUpload.push({ type: imageType, file: fileValidation.data });
    }
  }

  if (imageFilesToUpload.length === 0) {
    return { success: false, error: 'No valid image files provided.' };
  }
  if (!imageFilesToUpload.some(f => f.type === 'primary')) {
      return { success: false, error: 'Primary image (image_primary) is required.' };
  }

  // Store uploaded file paths for potential cleanup
  const uploadedStoragePaths: string[] = [];

  try {
    // --- 3. Find or Create Main Global Variable --- 
    const mainGlobalVariableId = await findOrCreateGlobalVariable(
        supabase, 
        validatedData.name, 
        validatedData.type, 
        validatedData.details
    );

    // --- 4. Create or Update Product Details --- 
    const productId = await upsertProductDetails(
        supabase, 
        mainGlobalVariableId, 
        validatedData
    );

    // --- 5. Insert/Update Food or Treatment Details ---
    let foodDetailsId: string | undefined;
    const allIngredients: IngredientInfo[] = [];

    if (validatedData.type === 'food') {
        foodDetailsId = await upsertFoodDetails(supabase, mainGlobalVariableId, validatedData as Extract<SaveItemInput, { type: 'food' }>);
        allIngredients.push(...(validatedData.ingredients || []));
    }

    if (validatedData.type === 'treatment') {
        const activeIngredients = validatedData.active_ingredients || [];
        const inactiveIngredients = validatedData.inactive_ingredients || [];
        const activeIngredientInfos = await resolveIngredientGvars(supabase, activeIngredients);
        allIngredients.push(...activeIngredientInfos, ...(inactiveIngredients));
    }

    // --- 6. Process and Link Ingredients --- 
    const resolvedIngredients = await resolveIngredientGvars(supabase, allIngredients);
    const itemIngredientIds = await linkIngredientsToItem(
        supabase, 
        mainGlobalVariableId, 
        resolvedIngredients,
        validatedData.type === 'treatment' ? ((validatedData as Extract<SaveItemInput, { type: 'treatment' }>).active_ingredients || []) : []
    );

    // --- 7. Find or Create User Variable Association --- 
    const { userVariableId, defaultUnitId } = await findOrCreateUserVariable(
        supabase, 
        userId, 
        mainGlobalVariableId
    );

    // --- 8. Upload Images and Link --- 
    const uploadedFilesInfo = await uploadAndLinkImages(
        supabase,
        userId,
        userVariableId,
        imageFilesToUpload,
        uploadedStoragePaths // Pass array to collect paths
    );

    // --- 9. Handle Treatment Specific Logic (e.g., patient_treatments) --- 
    let patientTreatmentId: string | undefined = undefined;
    if (validatedData.type === 'treatment') {
       patientTreatmentId = await ensurePatientTreatmentRecord(
            supabase,
            userId,
            mainGlobalVariableId,
            userVariableId,
            validatedData as Extract<SaveItemInput, { type: 'treatment' }>
       );
    }

    // --- 10. Revalidate Paths --- 
    revalidatePath('/patient');
    if (type === 'treatment') revalidatePath('/patient/treatments');
    revalidatePath('/patient/photos');

    // --- 11. Construct Success Response --- 
    const successData: SaveSuccessData = {
        globalVariableId: mainGlobalVariableId,
        userVariableId,
        productId,
        foodDetailsId,
        itemIngredientIds,
        uploadedFilesInfo,
        patientTreatmentId,
    };
    return { success: true, data: successData };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while saving the item.';
    logger.error('Error in saveItemFromImageAction catch block', {
        errorMessage,
        originalError: error,
        inputData: { ...validatedData, ingredients: undefined, active_ingredients: undefined, inactive_ingredients: undefined } // Avoid logging potentially large arrays
    });
    // Attempt storage cleanup
    if (uploadedStoragePaths.length > 0) {
        logger.warn('Attempting cleanup of storage objects due to error', { paths: uploadedStoragePaths });
        const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove(uploadedStoragePaths);
        if (removeError) {
            logger.error('Failed to cleanup storage objects after error', { paths: uploadedStoragePaths, removeError });
        } else {
            logger.info('Successfully cleaned up storage objects after error', { paths: uploadedStoragePaths });
        }
    }
    return { success: false, error: errorMessage };
  }
}

// ==================================
// Helper Functions for Save Logic
// ==================================

// Helper function type definitions expecting the resolved client
type ResolvedSupabaseClient = SupabaseClient<Database, "public">;

async function findOrCreateGlobalVariable(
    supabase: ResolvedSupabaseClient,
    name: string,
    type: 'food' | 'treatment' | 'other',
    details?: string,
    // Overload for ingredients
    isIngredient: boolean = false,
    ingredientUnit?: string | null
): Promise<string> {
    const trimmedName = name.trim();
    const slugId = slugify(trimmedName, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });

    let variableCategoryId: string;
    let defaultUnitId: string;

    if (isIngredient) {
        variableCategoryId = INGREDIENT_CATEGORY_ID;
        // Try to find a unit ID matching the ingredient unit string, otherwise use default
        const unitEntry = Object.entries(UNIT_IDS).find(([_, id]) => 
            ingredientUnit?.toLowerCase() === id || 
            (UNITS_DATA[id]?.abbreviated_name && ingredientUnit?.toLowerCase() === UNITS_DATA[id]?.abbreviated_name?.toLowerCase())
        );
        defaultUnitId = unitEntry ? unitEntry[1] : DEFAULT_INGREDIENT_UNIT_ID;
    } else {
        if (type === 'food') { variableCategoryId = VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS; defaultUnitId = UNIT_IDS.GRAM; }
        else if (type === 'treatment') { variableCategoryId = VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS; defaultUnitId = UNIT_IDS.DIMENSIONLESS; }
        else { variableCategoryId = VARIABLE_CATEGORY_IDS.HEALTH_AND_PHYSIOLOGY; defaultUnitId = UNIT_IDS.DIMENSIONLESS; }
    }

    // Check required constants
    if (!variableCategoryId || !defaultUnitId) {
      throw new Error('Configuration error: Missing category/unit ID.');
    }

    // 1. Try finding by slugified ID
    const { data: existingById, error: findByIdError } = await supabase
        .from('global_variables').select('id, name, description').eq('id', slugId).maybeSingle();
    if (findByIdError) throw new Error(`DB error (find GVar by ID ${slugId}): ${findByIdError.message}`);
    if (existingById) {
        logger.debug('Found existing GVar by ID', { id: existingById.id });
        // TODO: Consider updating name/description if different?
        return existingById.id;
    }

    // 2. Try finding by name and category (case-insensitive)
    const { data: existingByName, error: findByNameError } = await supabase
        .from('global_variables').select('id').ilike('name', trimmedName).eq('variable_category_id', variableCategoryId).limit(1).maybeSingle();
    if (findByNameError) throw new Error(`DB error (find GVar by Name ${trimmedName}): ${findByNameError.message}`);
    if (existingByName) {
        logger.debug('Found existing GVar by Name', { id: existingByName.id });
        // TODO: Consider updating description?
        return existingByName.id;
    }

    // 3. Create new global variable
    const { data: newVar, error: createError } = await supabase.from('global_variables').insert({
        id: slugId,
        name: trimmedName,
        description: isIngredient ? `Ingredient: ${trimmedName}` : details?.trim(), // Add prefix for ingredients?
        variable_category_id: variableCategoryId,
        default_unit_id: defaultUnitId
    }).select('id').single();

    if (createError || !newVar) throw new Error(`DB error (create GVar ${slugId}): ${createError?.message || 'Insert failed'}`);
    logger.info('Created new global variable', { id: newVar.id, name: trimmedName, category: variableCategoryId });
    return newVar.id;
}

async function upsertProductDetails(
    supabase: ResolvedSupabaseClient,
    globalVariableId: string,
    data: SaveItemInput
): Promise<string | null> {
    // Access properties safely
    const { type, name } = data;
    const brand = data.brand;
    const upc = data.upc;
    // Use correct enum type from Database types
    const productType: Database['public']['Enums']['product_type_enum'] = 
        type === 'food' || type === 'treatment' ? 'trackable_item' : 'other';

    if (productType !== 'trackable_item' && !brand && !upc) {
        return null;
    }

    const { data: productData, error } = await supabase
        .from('products')
        .upsert({
          global_variable_id: globalVariableId,
          product_type: productType,
          name: typeof name === 'string' ? name.trim() : name,
          // Safely trim optional strings
          brand_name: typeof brand === 'string' ? brand.trim() : undefined,
          upc: typeof upc === 'string' ? upc.trim() : undefined,
        }, { onConflict: 'global_variable_id' })
        .select('id')
        .single();
        
    if (error || !productData) {
        logger.warn('Could not save/update product details', { error, globalVariableId });
        return null; // Non-fatal, return null
    }
    logger.info('Product details saved/updated', { productId: productData.id });
    return productData.id;
}

async function upsertFoodDetails(
    supabase: ResolvedSupabaseClient,
    globalVariableId: string,
    data: Extract<SaveItemInput, { type: 'food' }>
): Promise<string> {
    const { servingSize_quantity, servingSize_unit, calories_per_serving, fat_per_serving, protein_per_serving, carbs_per_serving } = data;
    
    // Find unit ID for serving size unit string
    const servingUnitId = await findUnitId(supabase, servingSize_unit);

    const payload: Database['public']['Tables']['food_details']['Insert'] = {
        global_variable_id: globalVariableId,
        serving_size_quantity: servingSize_quantity,
        serving_size_unit_id: servingUnitId,
        calories_per_serving: calories_per_serving,
        fat_per_serving: fat_per_serving,
        protein_per_serving: protein_per_serving,
        carbs_per_serving: carbs_per_serving,
    };

    const { error } = await supabase.from('food_details').upsert(payload, { onConflict: 'global_variable_id' });

    if (error) {
        logger.error('Failed to upsert food_details', { error, globalVariableId });
        throw new Error(`DB error (upsert food_details): ${error.message}`);
    }
    logger.info('Food details saved/updated', { globalVariableId });
    return globalVariableId; // Return the GVar ID as the PK
}

async function resolveIngredientGvars(
    supabase: ResolvedSupabaseClient,
    ingredients: IngredientInfo[]
): Promise<IngredientInfo[]> {
    const resolvedIngredients: IngredientInfo[] = [];
    for (const ing of ingredients) {
        const gvarId = await findOrCreateGlobalVariable(supabase, ing.name, 'other', undefined, true, ing.unit);
        const unitId = await findUnitId(supabase, ing.unit);
        resolvedIngredients.push({ ...ing, global_variable_id: gvarId, unit_id: unitId });
    }
    return resolvedIngredients;
}

async function linkIngredientsToItem(
    supabase: ResolvedSupabaseClient,
    itemGlobalVariableId: string,
    resolvedIngredients: IngredientInfo[],
    originalActiveIngredients: Pick<IngredientInfo, 'name'>[] // Only need name to check if active
): Promise<string[]> {
    if (resolvedIngredients.length === 0) {
        return [];
    }

    const ingredientsToInsert = resolvedIngredients.map((ing, index) => {
        // Check if this ingredient name was in the original active list
        const isActive = originalActiveIngredients.some(activeIng => activeIng.name === ing.name);
        return {
            item_global_variable_id: itemGlobalVariableId,
            ingredient_global_variable_id: ing.global_variable_id!,
            quantity_per_serving: ing.quantity,
            unit_id: ing.unit_id,
            is_active_ingredient: isActive, 
            display_order: index,
        };
    });

    // Upsert ingredients based on the unique constraint (item_id, ingredient_id)
    const { data, error } = await supabase
        .from('item_ingredients')
        .upsert(ingredientsToInsert, { onConflict: 'item_global_variable_id, ingredient_global_variable_id' })
        .select('id');

    if (error || !data) {
        logger.error('Failed to link ingredients to item', { error, itemGlobalVariableId });
        throw new Error(`DB error (linking ingredients): ${error?.message || 'Upsert failed'}`);
    }
    logger.info(`Linked ${data.length} ingredients to item`, { itemGlobalVariableId });
    return data.map(d => d.id);
}

async function findOrCreateUserVariable(
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

    if (findError) throw new Error(`DB error checking user_variables: ${findError.message}`);

    if (existingUserVar) {
        logger.info('User already tracking this variable', { userId, globalVariableId });
        const defaultUnitId = existingUserVar.global_variables?.default_unit_id ?? UNIT_IDS.DIMENSIONLESS; // Fallback
        return { userVariableId: existingUserVar.id, defaultUnitId };
    } else {
        // Fetch the default unit ID from the global variable directly
        const { data: gvData, error: gvError } = await supabase.from('global_variables').select('default_unit_id').eq('id', globalVariableId).single();
        if (gvError || !gvData) throw new Error(`DB error fetching GVar default unit: ${gvError?.message || 'Not found'}`);
        const defaultUnitId = gvData.default_unit_id;

        const { data: newUserVar, error: createError } = await supabase
        .from('user_variables')
        .insert({ user_id: userId, global_variable_id: globalVariableId, preferred_unit_id: defaultUnitId })
        .select('id')
        .single();

        if (createError || !newUserVar) throw new Error(`DB error creating user_variables: ${createError?.message || 'Insert failed'}`);
        logger.info('Created user variable association', { userVariableId: newUserVar.id });
        return { userVariableId: newUserVar.id, defaultUnitId };
    }
}

// Helper to find unit ID from string (abbreviation or name)
// TODO: Cache this potentially?
import { UNITS_DATA } from '@/lib/constants/units'; // Import UNITS_DATA
async function findUnitId(supabase: ResolvedSupabaseClient, unitString?: string | null): Promise<string | null> {
    if (!unitString) return null;
    const trimmedUnit = unitString.trim().toLowerCase();
    if (!trimmedUnit) return null;

    // Check cache/constants first
    const unitEntry = Object.entries(UNIT_IDS).find(([key, id]) => 
        trimmedUnit === id.toLowerCase() || 
        trimmedUnit === UNITS_DATA[id]?.name?.toLowerCase() ||
        trimmedUnit === UNITS_DATA[id]?.abbreviated_name?.toLowerCase()
    );
    if (unitEntry) return unitEntry[1];

    // If not in constants, query DB (less efficient)
    logger.warn('Unit not found in constants, querying DB', { unitString });
    const { data: unitData, error } = await supabase
        .from('units')
        .select('id')
        .or(`name.ilike.${trimmedUnit},abbreviated_name.ilike.${trimmedUnit}`)
        .limit(1)
        .maybeSingle();
    
    if (error) {
        logger.error('DB error finding unit ID', { unitString, error });
        return null; // Don't fail the whole save for a unit lookup
    }
    if (!unitData) {
        logger.warn('Unit ID not found in DB for string', { unitString });
    }
    return unitData?.id ?? null;
}

async function uploadAndLinkImages(
    supabase: ResolvedSupabaseClient,
    userId: string,
    userVariableId: string,
    imageFiles: { type: ImageType; file: File }[],
    uploadedStoragePaths: string[] // Out param to collect paths for cleanup
): Promise<{ type: ImageType; uploadedFileId: string; userVariableImageLinked: boolean }[]> {
    const results: { type: ImageType; uploadedFileId: string; userVariableImageLinked: boolean }[] = [];

    for (const { type, file } of imageFiles) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const storagePath = `${userId}/${uniqueFileName}`;
        let currentStoragePath: string | null = null;

        try {
            logger.info('Attempting to upload image to storage', { userId, type, storagePath });
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(BUCKET_NAME)
              .upload(storagePath, file);

            if (uploadError || !uploadData) throw new Error(`Storage upload error: ${uploadError?.message || 'Upload failed'}`);
            currentStoragePath = uploadData.path;
            uploadedStoragePaths.push(currentStoragePath); // Add path for potential cleanup
            logger.info('Image uploaded successfully', { type, path: currentStoragePath });

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
             logger.error(`Error processing image type ${type}`, { error });
             // Don't re-throw, allow other images to process. Add partial failure info?
             // results.push({ type, uploadedFileId: 'ERROR', userVariableImageLinked: false }); 
             // For simplicity, just log and continue
        }
    }
    return results;
}

async function ensurePatientTreatmentRecord(
    supabase: ResolvedSupabaseClient,
    userId: string,
    treatmentGVarId: string,
    userVariableId: string,
    data: Extract<SaveItemInput, { type: 'treatment' }> // Expects the specific type
): Promise<string | undefined> {
    const { details, name, dosage_form, dosage_instructions, active_ingredients } = data; 
    const brand = data.brand; // Get brand for manufacturer

    // Resolve GVar IDs and Unit IDs for active ingredients for the JSONB column
    const resolvedActiveIngredients = await resolveIngredientGvars(supabase, active_ingredients || []);
    const activeIngredientsJson = resolvedActiveIngredients.map(ing => ({
      ingredient_global_variable_id: ing.global_variable_id,
      strength_quantity: ing.quantity,
      strength_unit_id: ing.unit_id
    }));

    // Determine treatment_type based on dosage_form (example, needs refinement)
    let treatmentType: string = 'unknown'; // Use string type as the enum is removed/changed
    const lowerDosageForm = typeof dosage_form === 'string' ? dosage_form.toLowerCase() : '';
    if (lowerDosageForm.includes('pill') || lowerDosageForm.includes('tablet') || lowerDosageForm.includes('capsule')) {
        treatmentType = 'medication';
    }
    // Add other checks if needed (e.g., liquid, inhaler, cream, etc.)
    else if (lowerDosageForm.includes('liquid') || lowerDosageForm.includes('syrup')) {
        treatmentType = 'liquid';
    }
    else if (lowerDosageForm.includes('cream') || lowerDosageForm.includes('ointment') || lowerDosageForm.includes('gel')) {
        treatmentType = 'topical';
    }
    else if (lowerDosageForm.includes('injection')) {
        treatmentType = 'injection';
    }
    else if (lowerDosageForm.includes('inhaler')) {
        treatmentType = 'inhalant';
    }
    else if (lowerDosageForm.includes('supplement')) {
        treatmentType = 'supplement';
    }

    // Ensure entry exists in the `treatments` table first, including new fields
    const treatmentPayload: Database['public']['Tables']['treatments']['Update'] = {
        id: treatmentGVarId,
        treatment_type: treatmentType,
        manufacturer: brand?.trim(),
        dosage_form: dosage_form?.trim(),
        dosage_instructions: dosage_instructions?.trim(),
        active_ingredients: activeIngredientsJson.length > 0 ? activeIngredientsJson : null
    };
    const { error: upsertTreatmentError } = await supabase
        .from('treatments')
        .upsert(treatmentPayload, { onConflict: 'id' });
      
    if(upsertTreatmentError) {
        logger.error('Error upserting treatment record', { error: upsertTreatmentError, treatmentGVarId, payload: treatmentPayload });
        throw new Error(`Database error ensuring treatment record exists: ${upsertTreatmentError.message}`);
    }

    // Add/Update patient_treatments record
    const { data: ptData, error } = await supabase
        .from('patient_treatments')
        .upsert({
            patient_id: userId,
            treatment_id: treatmentGVarId,
            user_variable_id: userVariableId,
            status: 'active',
            is_prescribed: false,
            // Safely trim optional details string
            patient_notes: typeof details === 'string' ? details.trim() : `Added via image analysis: ${name}`
        }, { onConflict: 'patient_id, treatment_id' })
        .select('id')
        .single();

    if (error || !ptData) {
        logger.error('Error upserting patient_treatments record', { error, userId, treatmentGVarId });
        throw new Error(`Database error upserting patient treatment: ${error?.message || 'Upsert failed'}`);
    }
    logger.info('Patient treatment record ensured', { patientTreatmentId: ptData.id });
    return ptData.id;
} 