import { logger } from "@/lib/logging"

const validationLogger = logger.createChildLogger("ChatValidation")

export function validateChatRequest(body: any) {
  validationLogger.debug("Validating chat request")

  if (!body) {
    validationLogger.error("Missing request body")
    throw new Error("Missing request body")
  }

  const { messages } = body

  if (!messages || !Array.isArray(messages)) {
    validationLogger.error("Invalid messages format", { data: { messages } })
    throw new Error("Messages must be an array")
  }

  if (messages.length === 0) {
    validationLogger.warn("Empty messages array")
    // This is not an error, just a warning
  }

  // Validate each message
  messages.forEach((message, index) => {
    if (!message.role || !message.content) {
      validationLogger.error("Invalid message format", { data: { index, message } })
      throw new Error(`Invalid message format at index ${index}`)
    }

    if (!["user", "assistant", "system"].includes(message.role)) {
      validationLogger.error("Invalid message role", { data: { index, role: message.role } })
      throw new Error(`Invalid message role at index ${index}: ${message.role}`)
    }
  })

  validationLogger.debug("Chat request validation successful")
  return { messages, userId: body.userId }
}
