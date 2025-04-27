'use server';

import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Tool } from '@google/genai';
import { env } from '@/lib/env'; 
import { logger } from '@/lib/logger';

const LOG_PREFIX = '[google-grounded-search]';

// Define the structure for the response we want
export interface GroundedSearchResult {
  answer: string;
  citations: {
    title?: string; // Title might not always be present
    url: string;
    // Start/end index might not be directly available in this API response structure
  }[];
  searchQueries?: string[]; // Add search queries used
  renderedContent?: string; // HTML content for Search Suggestions
}

// Use the GOOGLE_GENERATIVE_AI_API_KEY from environment
const API_KEY = env.GOOGLE_GENERATIVE_AI_API_KEY;
// Model compatible with the genai SDK and grounding tool
const MODEL_ID = 'gemini-2.5-flash-preview-04-17'; 

// Instantiate the Google AI client
if (!API_KEY) {
  logger.error(`${LOG_PREFIX} GOOGLE_GENERATIVE_AI_API_KEY is not configured.`);
  // Optional: Throw an error or handle appropriately if key is essential at module load
}
const genAI = new GoogleGenAI({ apiKey: API_KEY || '' }); // Pass API key in options object

// Define the grounding tool configuration using Google Search
// IMPORTANT: Use 'googleSearch' not 'googleSearchRetrieval' for @google/genai
const tools: Tool[] = [
  { googleSearch: {} }, 
];

// Safety settings (optional, adjust as needed)
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Generates a grounded answer using the Google AI SDK (@google/genai) with Google Search as a tool.
 * @param query The question/topic to search for (e.g., the treatment name).
 * @returns A promise resolving to the answer and citations, or null on error.
 */
export async function getGroundedAnswerAction(query: string): Promise<GroundedSearchResult | null> {
  logger.info(`${LOG_PREFIX} Getting grounded answer for query via @google/genai:`, { query });

  // --- Start Debug Logging ---
  logger.debug(`${LOG_PREFIX} Using Model ID:`, { modelId: MODEL_ID });
  logger.debug(`${LOG_PREFIX} GOOGLE_GENERATIVE_AI_API_KEY is set:`, { isSet: !!API_KEY });
  // --- End Debug Logging ---

  if (!API_KEY) {
    logger.error(`${LOG_PREFIX} GOOGLE_GENERATIVE_AI_API_KEY is not configured.`);
    return null;
  }
  if (!query) {
    logger.warn(`${LOG_PREFIX} Query is empty.`);
    return null;
  }

  try {
    // Select the generative model
    // @ts-ignore - Linter seems confused about this method's existence
    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      safetySettings,
      tools, // Pass the grounding tool config here
    });

    const result = await model.generateContent(query);
    const response = result.response;

    logger.info(`${LOG_PREFIX} Received response from @google/genai API.`);

    if (!response || !response.candidates?.length || !response.candidates[0].content?.parts?.length) {
      logger.warn(`${LOG_PREFIX} No valid candidates or content found in @google/genai response.`, { response });
      return null;
    }

    const candidate = response.candidates[0];
    const answer = candidate.content.parts.map(part => part.text).join('\n') || 'No answer generated.'; // Join parts if multiple

    const groundingMetadata = candidate.groundingMetadata;
    logger.debug(`${LOG_PREFIX} Received groundingMetadata:`, { groundingMetadata }); 
    const citations: GroundedSearchResult['citations'] = [];

    // Citation processing based on @google/genai structure (may differ)
    // Check groundingAttributions or groundingChunks based on observed metadata
    const attributions = groundingMetadata?.groundingAttributions ?? [];
    attributions.forEach(att => {
      if (att.web?.uri) { 
          citations.push({
              url: att.web.uri,
              title: att.web.title || 'Untitled'
          });
      } else if (att.retrievedContext?.uri) { 
           citations.push({
              url: att.retrievedContext.uri,
              title: att.retrievedContext.title || 'Untitled'
          });
      }
  });

    const searchQueries = groundingMetadata?.webSearchQueries;
    // Get rendered content for Search Suggestions display
    const renderedContent = groundingMetadata?.searchEntryPoint?.renderedContent;

    logger.info(`${LOG_PREFIX} Successfully processed grounded answer and ${citations.length} citations.`, { searchQueries });
    return { answer, citations, searchQueries, renderedContent };

  } catch (err: any) { 
    const logDetails: Record<string, any> = {};
    let errorMessage = "Error calling Google AI (@google/genai) API.";

    // Error structure might be simpler with this SDK
    logDetails.message = err.message;
    logDetails.stack = err.stack?.split('\n').map(line => line.trim());
    errorMessage = `${errorMessage} Message: ${err.message}`;

    // Include response details if available (often attached to the error object)
    if (err.response) {
        logDetails.responseStatus = err.response.status;
        logDetails.responseData = err.response.data; 
    }

    logger.error(`${LOG_PREFIX} ${errorMessage}`, logDetails);
    return null;
  }
} 