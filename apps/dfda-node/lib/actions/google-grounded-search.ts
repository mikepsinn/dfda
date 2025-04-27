'use server';

import { ConversationalSearchServiceClient, protos } from '@google-cloud/discoveryengine';
import { env } from '@/lib/env'; // Ensure GOOGLE_APPLICATION_CREDENTIALS or ADC is set
import { logger } from '@/lib/logger';

const LOG_PREFIX = '[google-grounded-search]';

// Define the structure for the response we want
export interface GroundedSearchResult {
  answer: string;
  citations: {
    title: string;
    url: string;
    startIndex?: number; // Optional: if API provides inline citation positions
    endIndex?: number;   // Optional: if API provides inline citation positions
  }[];
}

// TODO: Update with your actual Project ID and Location
const GCP_PROJECT_ID = env.GOOGLE_CLOUD_PROJECT_ID; // Assumes you add this to your env schema
const GCP_LOCATION = 'global'; // Or your specific location like 'us-central1'
// For grounding on Google Search, we typically use a default datastore ID provided by Google
const DATA_STORE_ID = 'google-search'; // This might vary, check Vertex AI Search docs/console

// Instantiate the client
// Ensure your environment provides credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
const searchClient = new ConversationalSearchServiceClient();

/**
 * Generates a grounded answer using Vertex AI Search with Google Search as the source.
 * @param query The question/topic to search for (e.g., the treatment name).
 * @returns A promise resolving to the answer and citations, or null on error.
 */
export async function getGroundedAnswerAction(query: string): Promise<GroundedSearchResult | null> {
  logger.info(`${LOG_PREFIX} Getting grounded answer for query:`, { query });

  if (!GCP_PROJECT_ID) {
    logger.error(`${LOG_PREFIX} GOOGLE_CLOUD_PROJECT_ID is not configured in environment variables.`);
    return null;
  }

  if (!query) {
    logger.warn(`${LOG_PREFIX} Query is empty.`);
    return null;
  }

  const request = {
    servingConfig: searchClient.projectLocationDataStoreServingConfigPath(
      GCP_PROJECT_ID,
      GCP_LOCATION,
      DATA_STORE_ID,
      'default_config' // Default config is usually sufficient
    ),
    query: { query },
    // Specify the model to use for generation (e.g., a Gemini model)
    model: {
        model: `projects/${GCP_PROJECT_ID}/locations/${GCP_LOCATION}/collections/default_collection/engines/gemini-1.5-pro-001`,
    },
    // Configure grounding to use Google Search
    groundingSpec: {
      groundingConfig: {
        sources: [{ source: 'GOOGLE_SEARCH' }],
      },
    },
    // Optional: Configure summary and citation settings
    summarySpec: {
      summaryResultCount: 5, // Number of results to base summary on
      includeCitations: true, // Request citation markers if available
    },
  };

  try {
    logger.debug(`${LOG_PREFIX} Sending request to Vertex AI Search:`, { request });
    
    // Await the result directly
    const result = await searchClient.converseConversation({
      name: searchClient.projectLocationDataStoreConversationPath(
        GCP_PROJECT_ID,
        GCP_LOCATION,
        DATA_STORE_ID,
        '-' // Use '-' for auto-creating a conversation ID
      ),
      // Structure query to match ITextInput: { input: string }
      query: { input: request.query.query }, 
      servingConfig: request.servingConfig,
      summarySpec: request.summarySpec,
      // Remove groundingSpec here if it's not part of the main request object
    });
    logger.info(`${LOG_PREFIX} Received response from Vertex AI Search.`);

    // Explicitly type the response object extracted from the result array
    const response = result[0] as protos.google.cloud.discoveryengine.v1.IConverseConversationResponse;

    if (!response || !response.reply?.summary) {
      logger.warn(`${LOG_PREFIX} No summary found in Vertex AI response or invalid response structure.`);
      return null;
    }

    const summary = response.reply.summary;
    const answer = summary.summaryText || 'No answer generated.';

    // Process citations - structure depends on API response
    // This assumes citations are linked via reply.searchResults
    const citations: GroundedSearchResult['citations'] = response.searchResults
      ?.map(result => {
        if (result.document?.derivedStructData?.fields?.link && result.document?.derivedStructData?.fields?.title) {
          return {
            url: result.document.derivedStructData.fields.link.stringValue || '#',
            title: result.document.derivedStructData.fields.title.stringValue || 'Untitled',
            // TODO: Check if summary.citationMetadata provides inline indices
            // startIndex: ...,
            // endIndex: ...,
          };
        }
        return null;
      })
      .filter((c): c is GroundedSearchResult['citations'][number] => c !== null) ?? [];

     // Alternative/Additional: Check summary.citationMetadata if available - REMOVED as type doesn't match
     /* 
     if (summary.citationMetadata?.citations) {
         // Process citations based on this structure if it's more suitable
         // This structure might provide startIndex/endIndex for inline markers
         // See: https://www.googlecloudcommunity.com/gc/AI-ML/Vertex-AI-Search-with-citations/m-p/815266
     }
     */

    logger.info(`${LOG_PREFIX} Successfully processed grounded answer and ${citations.length} citations.`);
    return { answer, citations };

  } catch (error) {
    logger.error(`${LOG_PREFIX} Error calling Vertex AI Search API:`, { error });
    return null;
  }
} 