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
  type: z.literal('food').describe("The item is classified as food."),
  servingSize_quantity: z.number().nullable().describe("Serving size quantity (e.g., 30, 1). Null if not specified."),
  servingSize_unit: z.string().nullable().describe("Serving size unit (e.g., 'g', 'cup', 'piece'). Null if quantity is null or unit not specified."),
  calories_per_serving: z.number().nullable().describe("Calories per serving. Null if not specified."),
  fat_per_serving: z.number().nullable().describe("Total Fat per serving in grams. Null if not specified."),
  protein_per_serving: z.number().nullable().describe("Protein per serving in grams. Null if not specified."),
  carbs_per_serving: z.number().nullable().describe("Total Carbohydrates per serving in grams. Null if not specified."),
  // Add other common nutrition fields if desired (e.g., sugar, sodium)
  ingredients: z.array(IngredientSchema).optional().describe("List of ingredients identified from the ingredients list image. Include quantity/unit if available."),
});

// --- Treatment Schema ---
const TreatmentSchema = BaseSchema.extend({
  type: z.literal('treatment').describe("The item is classified as a treatment (e.g., medication, supplement)."),
  dosage_form: z.string().optional().describe("Form of the treatment (e.g., 'tablet', 'capsule', 'liquid', 'inhaler')."),
  dosage_instructions: z.string().optional().describe("Instructions for use (e.g., 'Take two tablets daily', 'Apply to affected area')."),
  active_ingredients: z.array(IngredientSchema).optional().describe("List of ACTIVE ingredients identified, including strength (quantity/unit) if available (e.g., { name: 'Ibuprofen', quantity: 200, unit: 'mg' })."),
  inactive_ingredients: z.array(IngredientSchema).optional().describe("List of INACTIVE ingredients identified."),
});

// --- Other Schema ---
const OtherSchema = BaseSchema.extend({
  type: z.literal('other').describe("The item could not be clearly classified as food or treatment."),
  // No additional fields specific to 'other' for now
});


// --- Enhanced Discriminated Union Schema ---
const EnhancedAiOutputSchema = z.discriminatedUnion("type", [
  FoodSchema,
  TreatmentSchema,
  OtherSchema,
], {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_union_discriminator) {
      return { message: `Invalid type specified. Expected 'food', 'treatment', or 'other'. Received: ${JSON.stringify(issue.options)}` };
    }
    return { message: ctx.defaultError };
  },
}).describe("Schema for structured data extracted from item images. The 'type' field determines the expected fields.");


// Type for the successful result
export type AnalyzedImageResult = z.infer<typeof EnhancedAiOutputSchema>

// Map for expected image keys
const IMAGE_TYPES = ['primary', 'nutrition', 'ingredients', 'upc'] as const;
type ImageType = typeof IMAGE_TYPES[number];

export async function analyzeImageAction(formData: FormData): Promise<
  { success: true; data: AnalyzedImageResult } |
  { success: false; error: string }
> {

  const imageFiles: Partial<Record<ImageType, { file: File, buffer: Buffer }>> = {};
  let fileCount = 0;

  // Extract all potential image files
  for (const type of IMAGE_TYPES) {
    const key = `image_${type}`;
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        imageFiles[type] = { file, buffer };
        fileCount++;
        logger.info(`Found image file for type: ${type}`);
      } catch (error) {
        logger.error(`Error processing image file buffer for type: ${type}`, { error });
        return { success: false, error: `Error processing image file: ${type}` };
      }
    } else {
       logger.debug(`No image file found or file empty for type: ${type}`);
    }
  }

  if (fileCount === 0) {
    return { success: false, error: 'No image files provided.' };
  }
  if (!imageFiles.primary) {
      return { success: false, error: 'Primary image (image_primary) is required.'};
  }

  // Check if the shared AI client is available
  if (!googleAI || !defaultGoogleModel) {
    logger.error('Google AI client or default model is not available. Check API key.');
    return { success: false, error: 'AI service is not configured or unavailable.' };
  }

  // Construct messages for the AI
  const messages: CoreMessage[] = []; // Use CoreMessage[] type
  let textPrompt = `Analyze the provided image(s) to identify and classify the primary item. Extract details according to the schema, prioritizing the primary image for classification and name/brand, the nutrition image for nutrition facts (if food), the ingredients image for ingredients/dosage (active/inactive), and the UPC image for the barcode. Use the fields and descriptions in the schema. Classify as 'food', 'treatment', or 'other'. Respond strictly with the JSON object matching the schema.

Images provided:
`;

  const imageContent: { type: "image"; image: Buffer; mimeType: string; }[] = [];

  // Add image details to prompt and prepare image content array
  for (const type of IMAGE_TYPES) {
      if (imageFiles[type]) {
          textPrompt += `- ${type}\n`; // Add which images are included to the text prompt
          imageContent.push({
              type: 'image',
              image: imageFiles[type]!.buffer,
              mimeType: imageFiles[type]!.file.type,
          });
      }
  }
  
  // Add the combined text and image content as a single user message
  messages.push({
      role: 'user',
      content: [{ type: 'text', text: textPrompt }, ...imageContent]
  });

  try {
    logger.info("Sending request to AI for image analysis", { imageTypes: Object.keys(imageFiles) });
    const { object } = await generateObject({
      model: defaultGoogleModel,
      schema: EnhancedAiOutputSchema,
      messages: messages,
      // System prompt can be added here if needed for more context
      // system: "You are an expert assistant...",
    });

    // generateObject should validate, but we can re-parse for safety
    const validationResult = EnhancedAiOutputSchema.safeParse(object);
    if (!validationResult.success) {
        logger.error("AI response failed validation", { errors: validationResult.error.flatten(), receivedObject: object });
        // Try to provide a more specific error message
        const specificError = validationResult.error.errors[0]?.message || validationResult.error.flatten().formErrors.join('; ');
        return { success: false, error: `AI returned invalid data: ${specificError}` };
    }

    logger.info('Image(s) analyzed successfully', { type: validationResult.data.type, name: validationResult.data.name });
    return { success: true, data: validationResult.data };

  } catch (error) {
    logger.error('Error calling generateObject for image analysis:', { 
      error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error
    });

    if (NoObjectGeneratedError.isInstance(error)) {
      logger.error('NoObjectGeneratedError details:', { cause: error.cause, text: error.text });
      return { success: false, error: `The AI failed to generate valid structured data. Ensure images are clear and contain relevant text. Details: ${error.message}` };
    } else if (error instanceof Error) {
      return { success: false, error: `An unexpected error occurred during AI analysis: ${error.message}` };
    } else {
      return { success: false, error: 'An unknown error occurred during image analysis.' };
    }
  }
} 