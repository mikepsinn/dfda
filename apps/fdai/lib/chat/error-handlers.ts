export function handleMissingEnvVars(missingVars: string[]) {
  console.error("Missing required environment variables:", missingVars)
  return new Response(
    JSON.stringify({
      error: "Missing required environment variables",
      missingVariables: missingVars,
      message: "Please set the required environment variables to use the AI features.",
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}

export function handleMissingAIConfig() {
  console.warn("AI service not configured (missing OpenAI API key)")
  // Provide a fallback response if AI can't be used
  return new Response(
    JSON.stringify({
      role: "assistant",
      content:
        "I'm sorry, but the AI service is not configured properly. Please contact the administrator to set up the OpenAI API key.",
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}

export function handleOpenAIError(error: unknown) {
  console.error("Error calling OpenAI:", error)
  const errorMessage = error instanceof Error ? error.message : "Unknown error"
  console.error("Error details:", errorMessage)

  return new Response(
    JSON.stringify({
      error: "Failed to generate AI response",
      message: errorMessage,
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}

export function handleUnexpectedError(error: unknown) {
  console.error("Unexpected error in chat API route:", error)
  return new Response(
    JSON.stringify({
      error: "An unexpected error occurred",
      message: error instanceof Error ? error.message : "Unknown error",
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}
