// Define standard error types for the application

/**
 * Standard error response structure for API endpoints
 */
export interface ApiErrorResponse {
  error: string
  message: string
  details?: unknown
  code?: string
  status?: number
}

/**
 * Error types for categorizing different kinds of errors
 */
export enum ErrorType {
  // Authentication errors
  AUTHENTICATION = "authentication",
  UNAUTHORIZED = "unauthorized",

  // Data errors
  NOT_FOUND = "not_found",
  VALIDATION = "validation",
  DATABASE = "database",

  // External service errors
  AI_SERVICE = "ai_service",
  EXTERNAL_API = "external_api",

  // Application errors
  UNEXPECTED = "unexpected",
  CONFIGURATION = "configuration",
}

/**
 * Base application error class
 */
export class AppError extends Error {
  type: ErrorType
  status: number
  details?: unknown

  constructor(message: string, type: ErrorType = ErrorType.UNEXPECTED, status = 500, details?: unknown) {
    super(message)
    this.name = "AppError"
    this.type = type
    this.status = status
    this.details = details

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /**
   * Converts the error to a format suitable for API responses
   */
  toApiResponse(): ApiErrorResponse {
    return {
      error: this.type,
      message: this.message,
      details: this.details,
      status: this.status,
    }
  }

  /**
   * Creates a user-friendly message that can be displayed in the UI
   */
  toUserMessage(): string {
    switch (this.type) {
      case ErrorType.AUTHENTICATION:
        return "Please sign in to continue."
      case ErrorType.UNAUTHORIZED:
        return "You don't have permission to perform this action."
      case ErrorType.NOT_FOUND:
        return "The requested resource was not found."
      case ErrorType.VALIDATION:
        return "Please check your input and try again."
      case ErrorType.DATABASE:
        return "There was an issue with the database. Please try again later."
      case ErrorType.AI_SERVICE:
        return "The AI service is currently unavailable. Please try again later."
      case ErrorType.EXTERNAL_API:
        return "An external service is currently unavailable. Please try again later."
      case ErrorType.CONFIGURATION:
        return "There is a configuration issue. Please contact support."
      default:
        return "An unexpected error occurred. Please try again later."
    }
  }
}

/**
 * Database-specific error class
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorType.DATABASE, 500, details)
    this.name = "DatabaseError"

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorType.VALIDATION, 400, details)
    this.name = "ValidationError"

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorType.AUTHENTICATION, 401, details)
    this.name = "AuthenticationError"

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorType.NOT_FOUND, 404, details)
    this.name = "NotFoundError"

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

/**
 * AI service error class
 */
export class AIServiceError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorType.AI_SERVICE, 503, details)
    this.name = "AIServiceError"

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AIServiceError.prototype)
  }
}
