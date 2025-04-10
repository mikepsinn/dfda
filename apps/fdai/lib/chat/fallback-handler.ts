import { logger } from "@/lib/logging"

const fallbackLogger = logger.createChildLogger("FallbackHandler")

/**
 * Provides a fallback response when the OpenAI API fails
 */
export function getFallbackResponse(error: unknown): string {
  fallbackLogger.warn("Using fallback response due to API error", { error })

  return `
   <div class="space-y-4">
     <p>I'm sorry, but I'm having trouble connecting to my AI services right now. This could be due to:</p>
     <ul class="list-disc pl-5 space-y-1">
       <li>A temporary service disruption</li>
       <li>API rate limiting</li>
       <li>Configuration issues</li>
     </ul>
     <p>Please try again in a few moments. If the problem persists, please contact support with the following error code:</p>
     <p class="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">${new Date().getTime()}</p>
     <p class="text-xs text-gray-500">Error details: ${error instanceof Error ? error.message : String(error)}</p>
   </div>
 `
}

/**
 * Creates a simple JSON response for when streaming fails
 */
export function createFallbackJsonResponse(error: unknown) {
  fallbackLogger.warn("Creating fallback JSON response", { error })

  return {
    id: `fallback-${new Date().getTime()}`,
    role: "assistant",
    content: getFallbackResponse(error),
  }
}
