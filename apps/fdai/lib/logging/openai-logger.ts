import { addOpenAILog } from "@/app/api/debug/openai-logs/route"
import { getAIProvider } from "@/lib/env"

// Update each logging function to add logs to the debug viewer
export function logOpenAIRequest(model: string, messages: any[], options?: any) {
  const provider = getAIProvider()
  const redactedMessages = messages.map((message) => {
    if (message.content) {
      return { ...message, content: "[Redacted]" }
    }
    return message
  })

  // Add to debug logs
  addOpenAILog("debug", `Request to ${provider.toUpperCase()} API`, provider, {
    model,
    provider,
    timestamp: new Date().toISOString(),
    messageCount: messages.length,
    options: options ? JSON.stringify(options) : undefined,
    messages: redactedMessages,
  })
}

export function logOpenAIResponse(response: any) {
  const provider = getAIProvider()
  try {
    // Create a safe copy of the response for logging
    const safeResponse = {
      // Common properties across both formats
      model: response.model,
      provider,
      timestamp: new Date().toISOString(),

      // AI SDK specific properties
      content: response.content ? "[Content available]" : undefined,
      specificationVersion: response.specificationVersion,

      // Traditional OpenAI API properties
      id: response.id,
      object: response.object,
      created: response.created,
      choices: response.choices ? `[${response.choices.length} choices]` : undefined,
      usage: response.usage,

      // Response structure information
      responseType: typeof response,
      hasContent: !!response.content,
      hasChoices: !!response.choices,
      keys: Object.keys(response),
    }

    // Add to debug logs
    addOpenAILog("info", `Response received from ${provider.toUpperCase()}`, provider, safeResponse)
  } catch (error) {
    console.error(`Error logging ${provider} response:`, error)
    addOpenAILog("error", `Error logging ${provider} response`, provider, null, error)
  }
}

export function logOpenAIError(error: any) {
  const provider = getAIProvider()
  try {
    // Extract as much information as possible
    const errorInfo = {
      timestamp: new Date().toISOString(),
      provider,
      model: process.env.AI_MODEL,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      status: (error as any)?.status,
      statusText: (error as any)?.statusText,
    }

    // Try to extract response data if available
    try {
      if ((error as any)?.response?.data) {
        errorInfo.responseData = (error as any).response.data
      }
    } catch {}

    // Add to debug logs
    addOpenAILog("error", `${provider.toUpperCase()} API error`, provider, errorInfo, error)
  } catch (logError) {
    console.error(`Error logging ${provider} error:`, logError)
  }
}
