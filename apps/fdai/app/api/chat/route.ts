import { openai } from "@ai-sdk/openai"
import { googleGenerativeAI } from "@ai-sdk/google-generative-ai"
import { deepseek } from "@ai-sdk/deepseek"
import { streamText } from "ai"
import { healthTools } from "@/ai/tools"
import { createSystemPrompt } from "@/lib/chat/system-prompt"
import { getUserHealthContext } from "@/lib/user-context"
import { logger } from "@/lib/logging"
import { getAIProvider, getAIModel, isDebugMode } from "@/lib/env"
import { handleOpenAIError } from "@/lib/error-handling/openai-errors"
import { logOpenAIRequest, logOpenAIError } from "@/lib/logging/openai-logger"

// Create a module-specific logger
const chatApiLogger = logger.createChildLogger("ChatAPI")

export async function POST(request: Request) {
  const provider = getAIProvider()
  const modelName = getAIModel()
  const debugMode = isDebugMode()

  chatApiLogger.info(`Chat API request received`, { provider, model: modelName })

  try {
    // Parse request body
    const { messages, userId } = await request.json()

    // Get the user's health context if available
    let userContext = null
    if (userId) {
      try {
        userContext = await getUserHealthContext(userId)
      } catch (error) {
        chatApiLogger.error(`Failed to fetch user health context`, { error })
        // Continue without user context
      }
    }

    // Create the system prompt with user context
    const systemPrompt = createSystemPrompt(userContext)

    // Log the request (with sensitive data redacted)
    logOpenAIRequest(modelName, messages)

    // Get the appropriate model based on the configured provider
    const getModel = () => {
      switch (provider) {
        case "google":
          return googleGenerativeAI(modelName || "gemini-1.5-pro")
        case "deepseek":
          return deepseek(modelName || "deepseek-chat")
        case "openai":
        default:
          return openai(modelName || "gpt-4o")
      }
    }

    try {
      // Create a stream from the AI API
      const result = streamText({
        model: getModel(),
        system: systemPrompt,
        messages,
        maxSteps: 5, // Allow up to 5 tool calls in a single response
        tools: healthTools,
      })

      chatApiLogger.info(`Stream created successfully`, { provider, model: modelName })

      // Return the stream response
      return result.toDataStreamResponse()
    } catch (streamError) {
      // Log detailed error information
      logOpenAIError(streamError)

      // Handle AI-specific errors
      const aiError = handleOpenAIError(streamError)

      // Log detailed diagnostic information
      chatApiLogger.error(`AI stream error`, {
        error: streamError,
        provider,
        model: modelName,
        errorType: aiError.details?.type || "unknown",
        errorMessage: aiError.message,
        stack: streamError instanceof Error ? streamError.stack : undefined,
      })

      // Return a structured error response
      return new Response(
        JSON.stringify({
          error: "AI_SERVICE_ERROR",
          message: aiError.message,
          details: debugMode ? aiError.details : undefined,
          provider,
          model: modelName,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }
  } catch (error) {
    // This catches errors in request parsing or other non-AI parts
    chatApiLogger.error(`Fatal error in chat API route`, {
      error,
      provider,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return new Response(
      JSON.stringify({
        error: "CHAT_API_ERROR",
        message: "Failed to process chat request",
        details: debugMode
          ? {
              errorMessage: error instanceof Error ? error.message : String(error),
              provider,
              model: modelName,
            }
          : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
