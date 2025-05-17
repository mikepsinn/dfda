'use server'

import { z } from 'zod'
// Correct import based on project structure usage in profiles.ts
import { createClient } from '@/utils/supabase/server'
// import { cookies } from 'next/headers' // Likely not needed if createClient handles it
import { Database } from '@/lib/database.types'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
// import { v4 as uuidv4 } from 'uuid' // Removed unused import
// import slugify from 'slugify' // Removed unused import
// Import constants
// import { UNIT_IDS } from '@/lib/constants/units' // UNITS_DATA removed
// import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories' // Removed unused import
import { SupabaseClient } from '@supabase/supabase-js'
import { findOrCreateGlobalVariable, findUnitId } from '@/lib/global_variables.lib'
import { resolveIngredientGvars, linkIngredientsToParentVariable } from '@/lib/variable_ingredients.lib'
import { findOrCreateUserVariable, uploadAndLinkImages, ImageType } from '@/lib/user_variables.lib'
// import { BUCKET_NAME } from '@/lib/constants/storage' // REMOVED UNUSED
import { deleteFiles } from '@/lib/storage.lib'

// Re-define image types locally as it's used in validation loop
const IMAGE_TYPES = ['primary', 'nutrition', 'ingredients', 'upc'] as const;

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
    } catch (parseError) { // Renamed 'e' to 'parseError' and use it
      logger.error('Error parsing JSON string from FormData', { error: parseError, stringValue: str })
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON string" });
      return z.NEVER;
    }
  });

// Input schema validation directly from FormData
const SaveVariableMeasurementsInputSchema = z.object({
  userId: z.string().uuid(),
  // Allow 'supplement' in the input type from the frontend
  type: z.enum(['food', 'treatment', 'supplement', 'other']), 
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
export type SaveVariableMeasurementsInput = z.infer<typeof SaveVariableMeasurementsInputSchema>

// Type for ingredient data used in DB operations
// REMOVE this type if it was only used by extracted functions, or move to ingredients.lib.ts if needed there
// type IngredientInfo = z.infer<typeof IngredientInputSchema> & { global_variable_id?: string; unit_id?: string | null }; 

// Define a more specific return type for success, including potentially multiple file IDs
interface SaveVariableMeasurementsSuccessData {
    globalVariableId: string;
    userVariableId: string;
    productId?: string | null;
    foodDetailsId?: string; // PK is global_variable_id
    ingredientIds?: string[]; // Array of created item_ingredient IDs
    uploadedFilesInfo?: { type: ImageType; uploadedFileId: string; userVariableImageLinked: boolean }[];
    patientTreatmentId?: string; // Add missing field
}

// Define BUCKET_NAME here as it is used in the main action's error handling
// const BUCKET_NAME = 'user_uploads'; // REMOVED

// --- Internal Type-Specific Handlers --- 

// Food Handler - Transforms data and calls DB directly
async function _handleSaveFoodVariable(
    supabase: ResolvedSupabaseClient,
    userId: string, // Keep userId if needed for future logic, though unused now
    mainGlobalVariableId: string,
    data: SaveVariableMeasurementsInput
): Promise<{ foodDetailsId?: string; ingredientIds?: string[] }> {
    if (data.type !== 'food') {
        logger.error('_handleSaveFoodVariable called with incorrect type', { type: data.type });
        throw new Error('Internal error: Incorrect data type for food handler');
    }
    logger.info('Handling food variable save', { mainGlobalVariableId });

    // 1. Transform data to global_foods.Insert type
    const { servingSize_quantity, servingSize_unit, calories_per_serving, fat_per_serving, protein_per_serving, carbs_per_serving, ingredients } = data;
    const servingUnitId = await findUnitId(supabase, servingSize_unit);
    const foodDetailsPayload: Database['public']['Tables']['global_foods']['Insert'] = {
        global_variable_id: mainGlobalVariableId,
        serving_size_quantity: servingSize_quantity ?? null,
        serving_size_unit_id: servingUnitId, // findUnitId already returns null if not found
        calories_per_serving: calories_per_serving ?? null,
        fat_per_serving: fat_per_serving ?? null,
        protein_per_serving: protein_per_serving ?? null,
        carbs_per_serving: carbs_per_serving ?? null,
        // created_at, updated_at have defaults in DB
    };

    // 2. Upsert global_foods
    const { error: foodUpsertError } = await supabase
        .from('global_foods')
        .upsert(foodDetailsPayload, { onConflict: 'global_variable_id' });

    if (foodUpsertError) {
        logger.error('Failed to upsert global_foods', { error: foodUpsertError, globalVariableId: mainGlobalVariableId });
        throw new Error(`DB error (upsert global_foods): ${foodUpsertError.message}`);
    }
    logger.info('Food details saved/updated', { globalVariableId: mainGlobalVariableId });
    const foodDetailsId = mainGlobalVariableId; // PK is the GVar ID

    // 3. Resolve and link ingredients
    const resolvedIngredients = await resolveIngredientGvars(supabase, ingredients || []);
    const ingredientIds = await linkIngredientsToParentVariable(supabase, mainGlobalVariableId, resolvedIngredients, []);
    
    return { foodDetailsId, ingredientIds };
}

// Treatment Handler
async function _handleSaveTreatmentVariable(
    supabase: ResolvedSupabaseClient,
    userId: string,
    mainGlobalVariableId: string,
    userVariableId: string,
    data: SaveVariableMeasurementsInput
): Promise<{ patientTreatmentId?: string; ingredientIds?: string[] }> {
    if (data.type !== 'treatment') {
        logger.error('_handleSaveTreatmentVariable called with incorrect type', { type: data.type });
        throw new Error('Internal error: Incorrect data type for treatment handler');
    }
    logger.info('Handling treatment variable save', { mainGlobalVariableId, userVariableId });

    // 1. Extract necessary data
    const { details, name, dosage_form, dosage_instructions, active_ingredients, inactive_ingredients, brand } = data;
    const allIngredients = [...(active_ingredients || []), ...(inactive_ingredients || [])];

    // 2. Upsert Treatment Record
    // Resolve active ingredients for the treatments table JSONB column
    const resolvedActiveIngredients = await resolveIngredientGvars(supabase, active_ingredients ?? []);
    const activeIngredientsJson = resolvedActiveIngredients.map(ing => ({
      ingredient_global_variable_id: ing.global_variable_id,
      strength_quantity: ing.quantity,
      strength_unit_id: ing.unit_id
    }));

    // Determine treatment_type
    let treatmentType: string = 'unknown';
    const lowerDosageForm = typeof dosage_form === 'string' ? dosage_form.toLowerCase() : '';
    if (lowerDosageForm.includes('pill') || lowerDosageForm.includes('tablet') || lowerDosageForm.includes('capsule')) treatmentType = 'medication';
    else if (lowerDosageForm.includes('liquid') || lowerDosageForm.includes('syrup')) treatmentType = 'liquid';
    else if (lowerDosageForm.includes('cream') || lowerDosageForm.includes('ointment') || lowerDosageForm.includes('gel')) treatmentType = 'topical';
    else if (lowerDosageForm.includes('injection')) treatmentType = 'injection';
    else if (lowerDosageForm.includes('inhaler')) treatmentType = 'inhalant';
    else if (lowerDosageForm.includes('supplement')) treatmentType = 'supplement';

    // Create strict payload for treatments.Update
    const treatmentPayload = {
        id: mainGlobalVariableId,
        treatment_type: treatmentType,
        manufacturer: (typeof brand === 'string' && brand.trim()) ? brand.trim() : null,
        dosage_form: (typeof dosage_form === 'string' && dosage_form.trim()) ? dosage_form.trim() : null,
        dosage_instructions: (typeof dosage_instructions === 'string' && dosage_instructions.trim()) ? dosage_instructions.trim() : null,
        active_ingredients: activeIngredientsJson.length > 0 ? activeIngredientsJson : null,
    } satisfies Database['public']['Tables']['global_treatments']['Update'];

    const { error: upsertTreatmentError } = await supabase
        .from('global_treatments')
        .upsert(treatmentPayload, { onConflict: 'id' });

    if(upsertTreatmentError) {
        logger.error('Error upserting treatment record', { error: upsertTreatmentError, treatmentGVarId: mainGlobalVariableId, payload: treatmentPayload });
        throw new Error(`Database error ensuring treatment record exists: ${upsertTreatmentError.message}`);
    }
    logger.info('Treatment record ensured', { treatmentGVarId: mainGlobalVariableId });

    // 3. Upsert Patient Treatment Record
    const patientTreatmentPayload = {
        patient_id: userId,
        treatment_id: mainGlobalVariableId,
        user_variable_id: userVariableId,
        status: 'active', // Default or determine based on context?
        is_prescribed: false, // Default or determine based on context?
        patient_notes: typeof details === 'string' ? details.trim() : `Added via image analysis: ${name}`,
        // start_date, end_date could be added if available
    } satisfies Database['public']['Tables']['patient_treatments']['Update']; // Use Update for upsert
    
    const { data: ptData, error: patientTreatmentUpsertError } = await supabase
        .from('patient_treatments')
        .upsert(patientTreatmentPayload, { onConflict: 'patient_id, treatment_id' })
        .select('id')
        .single();

    if (patientTreatmentUpsertError || !ptData) {
        logger.error('Error upserting patient_treatments record', { error: patientTreatmentUpsertError, userId, treatmentGVarId: mainGlobalVariableId });
        throw new Error(`Database error upserting patient treatment: ${patientTreatmentUpsertError?.message || 'Upsert failed'}`);
    }
    const patientTreatmentId = ptData.id;
    logger.info('Patient treatment record ensured', { patientTreatmentId });

    // 4. Resolve and link all ingredients
    const resolvedIngredients = await resolveIngredientGvars(supabase, allIngredients);
    const ingredientIds = await linkIngredientsToParentVariable(supabase, mainGlobalVariableId, resolvedIngredients, active_ingredients || []);
    
    return { patientTreatmentId, ingredientIds };
}

// Main Action Function (Refactored Flow)
export async function saveVariableMeasurementsFromImageAction(formData: FormData): Promise<
  { success: true; data: SaveVariableMeasurementsSuccessData } |
  { success: false; error: string }
> {
  const supabase = await createClient();

  // --- 1. Parse and Validate Base Input (+ userId) --- 
  const inputData: Record<string, any> = {};
  // Use the specific schema keys
  Object.keys(SaveVariableMeasurementsInputSchema.shape).forEach((key) => {
    const value = formData.get(key as string);
    if (value !== null) {
      inputData[key as string] = value;
    }
  });

  const validation = SaveVariableMeasurementsInputSchema.safeParse(inputData);

  if (!validation.success) {
    logger.error('Invalid input for saveVariableMeasurementsFromImageAction', {
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
  const { userId, type } = validatedData;

  // --- 2. Validate Images --- 
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

  if (imageFilesToUpload.length === 0 || !imageFilesToUpload.some(f => f.type === 'primary')) {
    return { success: false, error: 'Primary image is required.' };
  }

  // --- 3. Core DB Operations (Common) --- 
  const uploadedStoragePaths: string[] = [];
  let mainGlobalVariableId: string;
  let userVariableId: string;
  let productId: string | null;
  let uploadedFilesInfo: { type: ImageType; uploadedFileId: string; userVariableImageLinked: boolean }[] = [];
  
  // Results from type-specific handlers
  let foodDetailsId: string | undefined;
  let patientTreatmentId: string | undefined;
  let ingredientIds: string[] = [];

  try {
    // Map 'supplement' to 'treatment' for global variable lookup/creation
    const typeForGVar = validatedData.type === 'supplement' ? 'treatment' : validatedData.type;
    mainGlobalVariableId = await findOrCreateGlobalVariable(supabase, validatedData.name, typeForGVar, validatedData.details);
    const { userVariableId: uvid } = await findOrCreateUserVariable(supabase, userId, mainGlobalVariableId);
    userVariableId = uvid;
    productId = await upsertProductDetails(supabase, mainGlobalVariableId, validatedData); 

    // --- 4. Upload Images (Specific to this action) --- 
    uploadedFilesInfo = await uploadAndLinkImages(supabase, userId, userVariableId, imageFilesToUpload, uploadedStoragePaths);

    // --- 5. Dispatch to Type-Specific Handlers --- 
    if (type === 'food') {
        const { foodDetailsId: fid, ingredientIds: iids } = await _handleSaveFoodVariable(
            supabase, userId, mainGlobalVariableId, validatedData
        );
        foodDetailsId = fid;
        ingredientIds = iids || [];
    } else if (type === 'treatment' || type === 'supplement') {
        const { patientTreatmentId: ptid, ingredientIds: iids } = await _handleSaveTreatmentVariable(
            supabase, userId, mainGlobalVariableId, userVariableId, validatedData
        );
        patientTreatmentId = ptid;
        ingredientIds = iids || [];
    } else { // Handle 'other' case (type === 'other')
        logger.info("Handling 'other' type variable save", { mainGlobalVariableId }); 
        const otherData = validatedData as SaveVariableMeasurementsInput & { type: 'other' }; 
        const resolvedIngredients = await resolveIngredientGvars(supabase, otherData.ingredients || []);
        ingredientIds = await linkIngredientsToParentVariable(supabase, mainGlobalVariableId, resolvedIngredients, []);
    }

    // --- 6. Revalidate Paths --- 
    revalidatePath('/patient');
    if (type === 'treatment') revalidatePath('/patient/treatments');
    revalidatePath('/patient/photos');

    // --- 7. Construct Success Response --- 
    const successData: SaveVariableMeasurementsSuccessData = {
        globalVariableId: mainGlobalVariableId,
        userVariableId,
        productId,
        foodDetailsId,
        ingredientIds, // Use collected ingredient IDs
        uploadedFilesInfo,
        patientTreatmentId,
    };
    return { success: true, data: successData };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while saving the variable measurements.';
    logger.error('Error in saveVariableMeasurementsFromImageAction catch block', {
        errorMessage,
        originalError: error,
        inputData: { ...validatedData, ingredients: undefined, active_ingredients: undefined, inactive_ingredients: undefined } // Avoid logging potentially large arrays
    });
    // Attempt storage cleanup
    if (uploadedStoragePaths.length > 0) {
        // Use the centralized delete function
        await deleteFiles(supabase, uploadedStoragePaths); 
        // logger.warn('Attempting cleanup of storage objects due to error', { paths: uploadedStoragePaths }); // Logging done in deleteFiles
        // const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove(uploadedStoragePaths); // Deletion logic moved
        // if (removeError) { // Logging done in deleteFiles
        //     logger.error('Failed to cleanup storage objects after error', { paths: uploadedStoragePaths, removeError });
        // } else {
        //     logger.info('Successfully cleaned up storage objects after error', { paths: uploadedStoragePaths });
        // }
    }
    return { success: false, error: errorMessage };
  }
}

// ==================================
// Helper Functions (Keep specific ones, remove extracted)
// ==================================

// Helper function type definitions expecting the resolved client
type ResolvedSupabaseClient = SupabaseClient<Database, "public">;

// findOrCreateGlobalVariable - REMOVED (moved to lib/gvars.lib.ts)

// upsertProductDetails - KEEP for now
async function upsertProductDetails(
    supabase: ResolvedSupabaseClient,
    globalVariableId: string,
    data: SaveVariableMeasurementsInput
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

// findOrCreateUserVariable - REMOVED (moved to lib/user-variables.lib.ts)

// uploadAndLinkImages - REMOVED (moved to lib/user-variables.lib.ts)

// _upsertTreatmentAndPatientRecord - KEEP for now
// ... (rest of the file) ... 