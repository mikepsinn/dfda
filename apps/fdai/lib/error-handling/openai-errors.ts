import { logger } from "@/lib/logging"
import { AIServiceError } from "@/types/error"
import { getAIProvider } from "@/lib/env"

const aiErrorLogger = logger.createChildLogger("AIErrors")

/**
 * Handles AI API errors with detailed diagnostics
 */
export function handleOpenAIError(error: unknown): AIServiceError {
  const provider = getAIProvider()

  // Extract raw error details for comprehensive logging
  const rawError = {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : typeof error,
    stack: error instanceof Error ? error.stack : undefined,
    code: (error as any)?.code,
    status: (error as any)?.status,
    statusText: (error as any)?.statusText,
    response: tryGetResponseData(error),
    toString: String(error),
  }

  aiErrorLogger.error(`${provider.toUpperCase()} API error`, { error, provider, rawError })

  // Extract useful information from the error
  let message = "An error occurred while communicating with the AI service"
  const details: any = {
    provider,
    model: process.env.AI_MODEL,
    errorData: rawError,
  }

  if (error instanceof Error) {
    message = error.message
    details.name = error.name
    details.stack = error.stack
  }

  // Common error patterns
  const errorStr = String(error)
  details.originalErrorString = errorStr

  // Extract HTTP status codes
  const statusMatch = errorStr.match(/status(\s+code)?:\s*(\d+)/i)
  if (statusMatch) {
    details.httpStatus = Number.parseInt(statusMatch[2])
  }

  // Check for specific error patterns
  if (
    errorStr.includes("API key") ||
    errorStr.includes("authentication") ||
    errorStr.includes("auth") ||
    errorStr.includes("key")
  ) {
    message = "Invalid or missing API key"
    details.type = "authentication"
  } else if (
    errorStr.includes("rate limit") ||
    errorStr.includes("quota") ||
    errorStr.includes("exceeded") ||
    errorStr.includes("too many")
  ) {
    message = "Rate limit exceeded. Please try again later."
    details.type = "rate_limit"
  } else if (errorStr.includes("timeout") || errorStr.includes("timed out")) {
    message = "Request timed out. Please try again."
    details.type = "timeout"
  } else if (
    errorStr.includes("maximum context length") ||
    errorStr.includes("too long") ||
    errorStr.includes("context window")
  ) {
    message = "The conversation is too long. Please start a new conversation."
    details.type = "context_length"
  } else if (
    errorStr.includes("content filter") ||
    errorStr.includes("content policy") ||
    errorStr.includes("safety") ||
    errorStr.includes("harmful")
  ) {
    message = "Your request was flagged by the content filter."
    details.type = "content_filter"
  } else if (errorStr.includes("No choices") || errorStr.includes("empty response")) {
    message = "The AI model returned an empty response."
    details.type = "empty_response"
  } else if (
    errorStr.includes("Unexpected response format") ||
    errorStr.includes("unexpected response structure") ||
    errorStr.includes("parsing")
  ) {
    message = "The AI service returned a response in an unexpected format"
    details.type = "response_format"
    details.suggestion = "This may be due to a version mismatch between the AI SDK and your code"
  } else if (errorStr.includes("network") || errorStr.includes("connection") || errorStr.includes("ECONNREFUSED")) {
    message = "Network error while connecting to the AI service"
    details.type = "network_error"
  } else if (errorStr.includes("unavailable") || errorStr.includes("not available") || errorStr.includes("down")) {
    message = "The AI service is currently unavailable"
    details.type = "service_unavailable"
  } else {
    // Generic error
    details.type = "unknown"
  }

  // Provider-specific error handling
  switch (provider) {
    case "google":
      if (errorStr.includes("RESOURCE_EXHAUSTED")) {
        message = "Google AI quota exceeded. Please try again later."
        details.type = "quota_exceeded"
      }
      break
    case "deepseek":
      // Add DeepSeek specific error patterns
      break
    case "openai":
      if (errorStr.includes("model_not_found") || errorStr.includes("The model")) {
        message = `The requested OpenAI model (${process.env.AI_MODEL || "default"}) is not available`
        details.type = "model_not_found"
      }
      break
  }

  // Create a standardized error
  return new AIServiceError(message, details)
}

// Helper function to try to extract response data from error objects
function tryGetResponseData(error: unknown): any {
  try {
    const anyError = error as any

    // Try different common patterns for response data
    if (anyError?.response?.data) {
      return anyError.response.data
    }

    if (anyError?.responseData) {
      return anyError.responseData
    }

    if (anyError?.data) {
      return anyError.data
    }

    return null
  } catch {
    return null
  }
}

/**
 * Checks if an error is related to the AI API
 */
export function isOpenAIError(error: unknown): boolean {
  if (!error) return false

  const errorStr = String(error)
  const provider = getAIProvider()

  // Common error patterns
  const commonPatterns = [
    "API key",
    "rate limit",
    "quota",
    "timeout",
    "content filter",
    "No choices",
    "context length",
    "ai",
    "model",
    "llm",
    "token",
  ]

  // Provider-specific patterns
  const providerPatterns: Record<string, string[]> = {
    openai: ["openai", "gpt", "completion", "davinci"],
    google: ["google", "gemini", "palm", "vertex"],
    deepseek: ["deepseek"],
  }

  // Check common patterns
  for (const pattern of commonPatterns) {
    if (errorStr.toLowerCase().includes(pattern.toLowerCase())) return true
  }

  // Check provider-specific patterns
  const patterns = providerPatterns[provider] || []
  for (const pattern of patterns) {
    if (errorStr.toLowerCase().includes(pattern.toLowerCase())) return true
  }

  return false
}
