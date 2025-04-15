import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from '@/lib/env'; // Use validated env variables
import { logger } from '@/lib/logger';

// Check for the API key during initialization
if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
  logger.warn('GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables. Google AI features will be disabled.');
}

// Create and export the Google Generative AI client instance
// Use a default provider that returns null or throws if the key is missing
// Or, simply export null if the key isn't present.
export const googleAI = env.GOOGLE_GENERATIVE_AI_API_KEY
  ? createGoogleGenerativeAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })
  : null;

// Optional: Export a specific model instance if you use one predominantly
export const defaultGoogleModel = googleAI ? googleAI('models/gemini-1.5-pro-latest') : null; 