'use server'

// import { createGoogleGenerativeAI } from '@ai-sdk/google'; // Removed local import
import { generateObject, NoObjectGeneratedError, CoreMessage } from 'ai'
import { z } from 'zod'
import { logger } from '@/lib/logger'
// import { env } from '@/lib/env'; // Env is likely handled by shared client
import { googleAI, defaultGoogleModel } from '@/lib/ai/google'; // Import shared client and model
// Import the relevant generated schema
// import { publicGlobalVariablesInsertSchemaSchema } from '@/lib/database.schemas'

// --- Ingredient Schema ---
const IngredientSchema = z.object({
  name: z.string().describe("Name of the ingredient (e.g., 'Enriched Wheat Flour', 'Ascorbic Acid', 'Ibuprofen')."),
  quantity: z.number().nullable().describe("Numerical quantity of the ingredient, if specified (e.g., 200, 10.5). Null if not specified."),
  unit: z.string().nullable().describe("Unit for the quantity, if specified (e.g., 'mg', 'g', '%'). Normalize common units (mcg, μg -> ug). Null if quantity is null or unit not specified."),
}).describe("Represents a single ingredient with optional quantity and unit.");

// --- Base Schema ---
const BaseSchema = z.object({
  name: z.string().describe("Identify the specific name of the primary item (e.g., \"Cheerios\", \"Advil Liqui-Gels\", \"Banana\"). Be concise."),
  brand: z.string().optional().describe("Brand name, if identifiable (e.g., \"General Mills\", \"Advil\")."),
  upc: z.string().optional().describe("UPC barcode number, if identifiable from any image."),
  details: z.string().optional().describe("(Optional) Provide any relevant additional details not covered by other fields."),
});

// --- Food Schema ---
const FoodSchema = BaseSchema.extend({
  type: z.literal('food').describe("ONLY use for items primarily intended for consumption as food or beverage (e.g., cereal, soda, bread). CRITICAL: DO NOT use for dietary supplements, medications, pills, capsules, powders etc."),
  servingSize_quantity: z.number().nullable().describe("Serving size quantity (e.g., 30, 1). Null if not specified."),
  servingSize_unit: z.string().nullable().describe("Serving size unit (e.g., 'g', 'cup', 'piece'). Null if quantity is null or unit not specified."),
  calories_per_serving: z.number().nullable().describe("Calories per serving. Null if not specified."),
  fat_per_serving: z.number().nullable().describe("Total Fat per serving in grams. Null if not specified."),
  protein_per_serving: z.number().nullable().describe("Protein per serving in grams. Null if not specified."),
  carbs_per_serving: z.number().nullable().describe("Total Carbohydrates per serving in grams. Null if not specified."),
  ingredients: z.array(IngredientSchema).optional().describe("List of regular food ingredients."),
});

// --- Treatment Schema ---
const TreatmentSchema = BaseSchema.extend({
  type: z.literal('treatment').describe("Use ONLY for medications (drugs), whether prescription or over-the-counter (e.g., Ibuprofen, Aspirin, prescription medications). DO NOT use for dietary supplements."),
  dosage_form: z.string().optional().describe("Form of the medication (e.g., 'tablet', 'capsule', 'liquid', 'inhaler', 'cream')."),
  dosage_instructions: z.string().optional().describe("Instructions for use (e.g., 'Take two tablets daily', 'Apply to affected area')."),
  active_ingredients: z.array(IngredientSchema).optional().describe("List of ACTIVE pharmaceutical ingredients (APIs), including strength (quantity/unit) if available (e.g., { name: 'Ibuprofen', quantity: 200, unit: 'mg' })."),
  inactive_ingredients: z.array(IngredientSchema).optional().describe("List of INACTIVE ingredients (excipients) identified, common in medications."),
});

// --- Supplement Schema (NEW) ---
const SupplementSchema = BaseSchema.extend({
  type: z.literal('supplement').describe("Use ONLY for dietary supplements (e.g., vitamins, minerals, herbs, amino acids like Taurine, protein powders, creatine). These are distinct from food and medication."),
  dosage_form: z.string().optional().describe("Form of the supplement (e.g., 'capsule', 'tablet', 'powder', 'liquid', 'gummy')."),
  serving_size_description: z.string().optional().describe("Serving size as text if specified (e.g., '1 scoop', '2 capsules'). Capture numeric quantity/unit in active ingredients if possible."), // Alternative/addition to numeric serving size
  dosage_instructions: z.string().optional().describe("Instructions for use (e.g., 'Take 2 capsules daily', 'Mix one scoop with water')."),
  active_ingredients: z.array(IngredientSchema).optional().describe("List of primary SUPPLEMENT ingredients/components, including strength/amount (quantity/unit) if available (e.g., { name: 'Vitamin C', quantity: 500, unit: 'mg' }, { name: 'Taurine', quantity: 1000, unit: 'mg' })."),
  // Often supplements list 'Other Ingredients' instead of 'Inactive'
  other_ingredients: z.array(IngredientSchema.pick({ name: true })).optional().describe("List of OTHER ingredients identified (often fillers, binders, etc., similar to inactive ingredients but commonly labelled differently on supplements). Just list names."), 
});

// --- Other Schema ---
const OtherSchema = BaseSchema.extend({
  type: z.literal('other').describe("Use ONLY if the item CANNOT be classified as 'food', 'treatment' (medication), or 'supplement' based on the definitions above (e.g., cleaning supplies, pet food, cosmetics)."),
  // No additional fields specific to 'other' for now
});


// --- Enhanced Discriminated Union Schema ---
const EnhancedAiOutputSchema = z.discriminatedUnion("type", [
  FoodSchema,
  TreatmentSchema,
  SupplementSchema, // Add SupplementSchema here
  OtherSchema,
], {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_union_discriminator) {
      // Update the error message to include 'supplement'
      return { message: `Invalid type specified. Expected 'food', 'treatment', 'supplement', or 'other'. Received: ${JSON.stringify(issue.options)}` }; 
    }
    return { message: ctx.defaultError };
  },
}).describe("Schema for structured data extracted from item images. The 'type' field determines the expected fields.");


// Type for the successful result
export type AnalyzedImageResult = z.infer<typeof EnhancedAiOutputSchema>

// Map for expected image keys
const IMAGE_TYPES = ['primary', 'nutrition', 'ingredients', 'upc'] as const;
type ImageType = typeof IMAGE_TYPES[number];

// --- Step 1: Classification Schema ---
const ClassificationSchema = z.object({
    type: z.enum(['food', 'treatment', 'supplement', 'other'])
        .describe("Classify the item based SOLELY on the primary image. Is it food/beverage, medication, dietary supplement, or something else? Choose one.")
});
type DeterminedType = z.infer<typeof ClassificationSchema>['type'];

// --- Main Action --- 
export async function analyzeImageAction(formData: FormData): Promise<
  { success: true; data: AnalyzedImageResult } |
  { success: false; error: string }
> {

  // --- File Processing (Same as before) ---
  const imageFiles: Partial<Record<ImageType, { file: File, buffer: Buffer }>> = {};
  let fileCount = 0;
  for (const type of IMAGE_TYPES) {
    const key = `image_${type}`;
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        imageFiles[type] = { file, buffer };
        fileCount++;
      } catch (error) {
        logger.error(`Error processing image file buffer for type: ${type}`, { error });
        return { success: false, error: `Error processing image file: ${type}` };
      }
    }
  }

  if (fileCount === 0) return { success: false, error: 'No image files provided.' };
  if (!imageFiles.primary) return { success: false, error: 'Primary image is required.' };
  if (!googleAI || !defaultGoogleModel) {
    logger.error('Google AI client or default model is not available.');
    return { success: false, error: 'AI service is not configured.' };
  }

  // --- STEP 1: Classification Call ---
  let determinedType: DeterminedType;
  try {
    logger.info("Step 1: Requesting classification from AI using primary image.");
    // Add concrete examples to the prompt
    const classificationPrompt = "Based ONLY on the primary image, classify the item by choosing ONE type: 'food', 'treatment', 'supplement', or 'other'. Examples: Cereal box -> 'food'; Prescription bottle -> 'treatment'; Vitamin C pills -> 'supplement'; Cleaning spray -> 'other'. Respond ONLY with the chosen type string.";
    
    const classificationMessages: CoreMessage[] = [{
          role: 'user',
          content: [
            { type: 'text', text: classificationPrompt },
            {
              type: 'image',
                image: imageFiles.primary.buffer, 
                mimeType: imageFiles.primary.file.type 
            }
        ]
    }];

    const { object: classificationObject } = await generateObject({
        model: defaultGoogleModel,
        schema: ClassificationSchema,
        messages: classificationMessages,
    });

    // Basic validation for the simple classification schema
    const classificationResult = ClassificationSchema.safeParse(classificationObject);
    if (!classificationResult.success) {
        logger.error("AI classification response failed validation", { errors: classificationResult.error.flatten(), receivedObject: classificationObject });
        return { success: false, error: `AI returned invalid classification data: ${classificationResult.error.errors[0]?.message}` };
    }

    determinedType = classificationResult.data.type;
    logger.info(`Step 1: Classification successful. Determined type: ${determinedType}`);

    // --- User Requirement: Treat 'supplement' as 'treatment' ---
    if (determinedType === 'supplement') {
      logger.info(`Reclassifying type from 'supplement' to 'treatment' based on user requirement.`);
      determinedType = 'treatment';
    }
    // --- End User Requirement ---

  } catch (error) {
    logger.error('Error during Step 1 (Classification) AI call:', { error });
    if (NoObjectGeneratedError.isInstance(error)) {
      return { success: false, error: `AI failed to generate classification. Details: ${error.message}` };
    } 
    return { success: false, error: 'An error occurred during classification.' };
  }

  // --- STEP 2: Extraction Call ---
  try {
    logger.info(`Step 2: Requesting data extraction for type '${determinedType}' using all images.`);

    // Select the correct detailed schema based on the determined type
    let extractionSchema: z.ZodObject<any, any, any>; // Use a general type
    switch (determinedType) {
      case 'food':       extractionSchema = FoodSchema; break;
      case 'treatment':  extractionSchema = TreatmentSchema; break;
      case 'supplement': extractionSchema = SupplementSchema; break;
      case 'other':      extractionSchema = OtherSchema; break;
      default: 
        logger.error("Invalid determinedType after classification", { determinedType });
        return { success: false, error: "Internal error: Invalid type determined." };
    }

    // Prepare prompt and messages for extraction
    const extractionPrompt = `The item has been classified as '${determinedType}'. Now, extract all relevant details from the provided images according to the specific schema for this type. Prioritize images logically (e.g., nutrition image for food nutrition, ingredients image for ingredients/dosage, UPC for barcode). Respond strictly with the JSON object matching the schema.

Images provided:
${Object.keys(imageFiles).map(type => `- ${type}`).join('\n')}`;

    const imageContent: { type: "image"; image: Buffer; mimeType: string; }[] = [];
    for (const type of IMAGE_TYPES) {
        if (imageFiles[type]) {
            imageContent.push({
                type: 'image',
                image: imageFiles[type]!.buffer,
                mimeType: imageFiles[type]!.file.type,
            });
        }
    }

    const extractionMessages: CoreMessage[] = [{
        role: 'user',
        content: [{ type: 'text', text: extractionPrompt }, ...imageContent]
    }];

    // Call generateObject for extraction
    const { object: extractionObject } = await generateObject({
        model: defaultGoogleModel,
        schema: extractionSchema, // Use the specific schema for the determined type
        messages: extractionMessages,
    });

    logger.info("Step 2: Received extraction object from AI", { receivedObject: extractionObject });

    // Validate the extracted object against the *specific* schema used
    const extractionResult = extractionSchema.safeParse(extractionObject);
    if (!extractionResult.success) {
      logger.error("AI extraction response failed validation", { determinedType, errors: extractionResult.error.flatten(), receivedObject: extractionObject });
      return { success: false, error: `AI returned invalid data for type '${determinedType}': ${extractionResult.error.errors[0]?.message}` };
    }

    // Ensure the `type` field in the result matches the final determined type
    // (The schema should enforce this via `z.literal`, but double-check and enforce user rule)
    if (extractionResult.data.type !== determinedType) {
        // If the AI somehow still returned 'supplement' after we forced 'treatment' flow
        // Use 'as any' to bypass strict type checking for this specific edge case check
        if (determinedType === 'treatment' && (extractionResult.data.type as any) === 'supplement') {
             logger.warn("AI extracted type 'supplement' but determined type was forced to 'treatment'. Overwriting type to 'treatment'.", { determinedType, extractedType: extractionResult.data.type });
             extractionResult.data.type = 'treatment'; // Force correct type
        } else {
          // Log other mismatches as errors
          logger.error("Mismatch between determined type and extracted type", { determinedType, extractedType: extractionResult.data.type });
          return { success: false, error: "Internal error: Type mismatch after extraction." };
        }
    }

    logger.info(`Step 2: Extraction successful for type '${determinedType}'`, { validatedData: extractionResult.data });
    
    // Cast the validated data to the union type for the return signature
    return { success: true, data: extractionResult.data as AnalyzedImageResult };

  } catch (error) {
    logger.error(`Error during Step 2 (Extraction for type '${determinedType}') AI call:`, { error });
    if (NoObjectGeneratedError.isInstance(error)) {
      return { success: false, error: `AI failed to generate details for type '${determinedType}'. Details: ${error.message}` };
    }
    return { success: false, error: `An error occurred during data extraction for type '${determinedType}'.` };
  }
} 