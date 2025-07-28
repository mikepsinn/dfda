import { AppError, ErrorType, DatabaseError } from "@/types/error"
import type { ApiResponse } from "@/types/api"

/**
 * Converts any error to an AppError
 */
export function normalizeError(error: unknown): AppError {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error
  }

  // If it's a standard Error, convert it
  if (error instanceof Error) {
    return new AppError(error.message)
  }

  // If it's a string, use it as the message
  if (typeof error === "string") {
    return new AppError(error)
  }

  // For anything else, stringify if possible
  try {
    const message = JSON.stringify(error)
    return new AppError(message)
  } catch {
    return new AppError("An unknown error occurred")
  }
}

/**
 * Handles database errors from Supabase
 */
export function handleDatabaseError(error: unknown): DatabaseError {
  const normalizedError = normalizeError(error)

  // Extract useful information from Supabase errors
  let details = normalizedError.details
  let message = normalizedError.message

  // Check if it's a Supabase error with a code
  if (typeof error === "object" && error !== null) {
    const supabaseError = error as any

    if (supabaseError.code) {
      details = {
        code: supabaseError.code,
        hint: supabaseError.hint,
        details: supabaseError.details,
        ...details,
      }

      // Provide more user-friendly messages for common errors
      if (supabaseError.code === "23505") {
        message = "This record already exists."
      } else if (supabaseError.code === "23503") {
        message = "This operation references a record that does not exist."
      } else if (supabaseError.code === "42P01") {
        message = "Database table does not exist. The database schema may not be set up correctly."
      }
    }
  }

  return new DatabaseError(message, details)
}

/**
 * Creates a standardized API error response
 */
export function createErrorResponse<T>(error: unknown): ApiResponse<T> {
  const appError = normalizeError(error)

  return {
    error: {
      message: appError.message,
      code: appError.type,
      details: appError.details,
    },
    status: "error",
  }
}

/**
 * Creates a standardized API success response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    status: "success",
  }
}

/**
 * Safely executes a database operation and handles errors consistently
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage = "Database operation failed",
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    throw handleDatabaseError(error)
  }
}

/**
 * Validates that required environment variables are present
 */
export function validateRequiredEnvVars(requiredVars: string[]): void {
  const missingVars = requiredVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    throw new AppError(
      `Missing required environment variables: ${missingVars.join(", ")}`,
      ErrorType.CONFIGURATION,
      500,
      { missingVars },
    )
  }
}

/**
 * Logs an error with consistent formatting
 */
export function logError(error: unknown, context?: string): void {
  const appError = normalizeError(error)
  const contextPrefix = context ? `[${context}] ` : ""

  console.error(`${contextPrefix}Error: ${appError.message}`)

  if (appError.details) {
    console.error(`${contextPrefix}Details:`, appError.details)
  }

  if (error instanceof Error && error.stack) {
    console.error(`${contextPrefix}Stack:`, error.stack)
  }
}
