'use server'

// import { createGoogleGenerativeAI } from '@ai-sdk/google'; // Removed local import
import { generateObject, NoObjectGeneratedError, CoreMessage } from 'ai'
import { z } from 'zod'
import { logger } from '@/lib/logger'
// import { env } from '@/lib/env'; // Env is likely handled by shared client
import { googleAI, defaultGoogleModel } from '@/lib/ai/google'; // Import shared client and model
// Import the relevant generated schema
// import { publicGlobalVariablesInsertSchemaSchema } from '@/lib/database.schemas'

import { FoodSchema, OtherSchema, TreatmentSchema, type AnalyzedImageResult } from '@/lib/image-analysis-schemas'

export type { AnalyzedImageResult } from '@/lib/image-analysis-schemas'

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