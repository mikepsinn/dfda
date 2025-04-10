import { NextResponse } from "next/server"
import { logger } from "@/lib/logging"
import { AppError, ErrorType } from "@/types/error"

const apiErrorLogger = logger.createChildLogger("ApiErrors")

/**
 * Creates a standardized error response for API routes
 */
export function createApiErrorResponse(error: unknown, status = 500) {
  // Log the error
  apiErrorLogger.error("API error", { error })

  // Normalize the error
  let appError: AppError

  if (error instanceof AppError) {
    appError = error
  } else if (error instanceof Error) {
    appError = new AppError(error.message, ErrorType.UNEXPECTED, status)
  } else {
    appError = new AppError(
      typeof error === "string" ? error : "An unexpected error occurred",
      ErrorType.UNEXPECTED,
      status,
    )
  }

  // Create the response
  return NextResponse.json(
    {
      error: appError.type,
      message: appError.message,
      details: process.env.NODE_ENV === "development" ? appError.details : undefined,
    },
    { status: appError.status },
  )
}

/**
 * Creates a standardized success response for API routes
 */
export function createApiSuccessResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

/**
 * Handles common API errors
 */
export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return createApiErrorResponse(error, error.status)
  }

  // Check for specific error types
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes("not found") || errorMessage.includes("No rows found")) {
    return createApiErrorResponse(new AppError("Resource not found", ErrorType.NOT_FOUND, 404), 404)
  }

  if (errorMessage.includes("not authorized") || errorMessage.includes("permission denied")) {
    return createApiErrorResponse(new AppError("Not authorized", ErrorType.UNAUTHORIZED, 403), 403)
  }

  if (errorMessage.includes("validation")) {
    return createApiErrorResponse(
      new AppError("Validation error", ErrorType.VALIDATION, 400, { originalError: errorMessage }),
      400,
    )
  }

  // Default error response
  return createApiErrorResponse(error)
}
