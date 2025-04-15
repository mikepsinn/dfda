'use server'

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject, NoObjectGeneratedError } from 'ai'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'

// Define the expected structured output from the AI
const AnalyzedImageSchema = z.object({
  type: z.enum(['food', 'treatment', 'other']).describe('The type of item identified in the image.'),
  name: z.string().describe('The specific name of the food or treatment identified.'),
  details: z.string().optional().describe('Any additional relevant details about the item.'),
})

// Ensure GOOGLE_GENERATIVE_AI_API_KEY is set in your environment variables
const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY, // Use the validated env variable
})

// Type for the successful result
export type AnalyzedImageResult = z.infer<typeof AnalyzedImageSchema>

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
  // No need for base64 with Gemini usually, pass buffer directly

  try {
    const { object } = await generateObject({
      // Use the specified Gemini model that supports image input
      model: google('models/gemini-2.0-flash-001'), // Updated model ID
      schema: AnalyzedImageSchema,
      // System prompt might need adjustment for Gemini if behavior differs
      // system: 'You are an expert assistant classifying images as food or medical treatments.',
      prompt: 'Analyze this image. Is it primarily showing a type of food, a medical treatment (like pills, inhaler, injection), or something else? Provide the specific name and any relevant details.',
      // Include the image data in the messages payload
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image. Is it primarily showing a type of food, a medical treatment (like pills, inhaler, injection), or something else? Provide the specific name and any relevant details.'
            },
            {
              type: 'image',
              image: imageBuffer, // Pass the buffer directly
              mimeType: file.type, // Include mime type
            }
          ]
        }
      ]
    })

    logger.info('Image analyzed successfully with Gemini', { result: object })
    return { success: true, data: object }

  } catch (error) {
    logger.error('Error analyzing image with Gemini:', { error })

    if (NoObjectGeneratedError.isInstance(error)) {
      return { success: false, error: `The AI failed to identify the item. Details: ${error.message}` }
    } else if (error instanceof Error) {
      // Check for specific provider errors if needed
      return { success: false, error: `An unexpected error occurred: ${error.message}` }
    } else {
      return { success: false, error: 'An unknown error occurred during image analysis.' }
    }
  }
} 