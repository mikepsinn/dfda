import { AppError } from "@/types/error"
import { logger } from "@/lib/logging"

const uiErrorLogger = logger.createChildLogger("UiErrors")

/**
 * Creates a user-friendly error message for UI display
 */
export function createUserFriendlyError(error: unknown): { message: string; details?: string } {
  // Log the error
  uiErrorLogger.error("UI error", { error })

  // Normalize the error
  if (error instanceof AppError) {
    return {
      message: error.toUserMessage(),
      details: process.env.NODE_ENV === "development" ? JSON.stringify(error.details) : undefined,
    }
  }

  if (error instanceof Error) {
    return {
      message: getUserFriendlyMessage(error.message),
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }
  }

  return {
    message: "An unexpected error occurred. Please try again later.",
    details: process.env.NODE_ENV === "development" ? String(error) : undefined,
  }
}

/**
 * Converts technical error messages to user-friendly ones
 */
function getUserFriendlyMessage(technicalMessage: string): string {
  // Database errors
  if (technicalMessage.includes("duplicate key") || technicalMessage.includes("unique constraint")) {
    return "This record already exists in our system."
  }

  if (technicalMessage.includes("foreign key constraint")) {
    return "This operation references a record that doesn't exist."
  }

  if (technicalMessage.includes("does not exist")) {
    return "The requested resource could not be found."
  }

  // Authentication errors
  if (technicalMessage.includes("not authenticated") || technicalMessage.includes("not authorized")) {
    return "You need to sign in to perform this action."
  }

  if (technicalMessage.includes("invalid credentials")) {
    return "The email or password you entered is incorrect."
  }

  if (technicalMessage.includes("email not confirmed")) {
    return "Please verify your email address before signing in."
  }

  // Validation errors
  if (technicalMessage.includes("validation")) {
    return "Please check your input and try again."
  }

  // Network errors
  if (technicalMessage.includes("network") || technicalMessage.includes("fetch")) {
    return "There was a problem connecting to the server. Please check your internet connection."
  }

  // Default message
  return "An error occurred. Please try again later."
}

/**
 * Handles errors in async UI operations
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  errorHandler: (error: unknown) => void,
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    errorHandler(error)
    return null
  }
}
