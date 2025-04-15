'use server'

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject, NoObjectGeneratedError } from 'ai'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'
// Import the relevant generated schema
import { publicGlobalVariablesInsertSchemaSchema } from '@/lib/database.schemas'

// --- Create a new schema specifically for AI output, based on the generated one --- 
const AiOutputSchema = z.object({
  // Keep the 'type' field as it's specific to the analysis task
  type: z.enum(['food', 'treatment', 'other'])
          .describe('Classify the primary item in the image as either "food", "treatment" (e.g., pill, inhaler), or "other".'),
  // Pick 'name' from the global_variables schema and add a description
  name: publicGlobalVariablesInsertSchemaSchema.shape.name
          .describe('Identify the specific name of the item (e.g., "Apple", "Ibuprofen 200mg", "Laptop"). Be concise.'),
  // Pick 'description' (mapped to 'details' here), make optional, and add a description
  details: publicGlobalVariablesInsertSchemaSchema.shape.description.optional()
          .describe('(Optional) Provide any relevant additional details, like brand, dosage, serving size, or distinguishing features.'),
});
// --- End new schema definition ---

// Ensure GOOGLE_GENERATIVE_AI_API_KEY is set in your environment variables
const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY, // Use the validated env variable
})

// Type for the successful result - Now derived from our new schema
export type AnalyzedImageResult = z.infer<typeof AiOutputSchema>

export async function analyzeImageAction(formData: FormData): Promise<
  { success: true; data: AnalyzedImageResult } |
  { success: false; error: string }
> {
  const file = formData.get('image') as File | null

  if (!file) {
    return { success: false, error: 'No image file provided.' }
  }

  // Convert image file to Buffer
  const imageBuffer = Buffer.from(await file.arrayBuffer())

  try {
    const { object } = await generateObject({
      model: google('models/gemini-2.0-flash-001'), 
      // Use the new schema with descriptions
      schema: AiOutputSchema, 
      // System prompt might need adjustment for Gemini if behavior differs
      // system: 'You are an expert assistant classifying images and extracting information according to the provided schema.',
      // Simplified prompt, relying on schema descriptions
      prompt: 'Analyze the image and extract information according to the schema.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              // Simplified text prompt
              text: 'Analyze this image and provide the type, name, and details according to the schema fields and their descriptions.' 
            },
            {
              type: 'image',
              image: imageBuffer, 
              mimeType: file.type, 
            }
          ]
        }
      ]
    })

    // The 'object' variable here is already validated and typed as AnalyzedImageResult
    logger.info('Image analyzed successfully with Gemini', { result: object })
    return { success: true, data: object }

  } catch (error) {
    logger.error('Error analyzing image with Gemini:', { error })

    if (NoObjectGeneratedError.isInstance(error)) {
      logger.error('NoObjectGeneratedError details:', { cause: error.cause, text: error.text });
      return { success: false, error: `The AI failed to generate valid structured data matching the schema. Details: ${error.message}` }
    } else if (error instanceof Error) {
      return { success: false, error: `An unexpected error occurred: ${error.message}` }
    } else {
      return { success: false, error: 'An unknown error occurred during image analysis.' }
    }
  }
} 