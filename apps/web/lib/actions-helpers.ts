import { PostgrestSingleResponse } from "@supabase/supabase-js"
import { logger } from "./logger"

/**
 * Safe type casting for Supabase data results
 * Helps with TS2352 errors for "neither type sufficiently overlaps with the other"
 */
export function safeCast<T>(data: unknown): T {
  return data as T
}

/**
 * Helper function to safely handle response from database select operations with proper type
 */
export function handleDatabaseResponse<T>(
  response: PostgrestSingleResponse<any>
): T {
  const { data, error } = response

  if (error) {
    logger.error("Database error:", { error })
    throw new Error(`Database operation failed: ${error.message}`)
  }

  return data as T
}

/**
 * Helper function for safely handling collection responses
 */
export function handleDatabaseCollectionResponse<T>(
  response: PostgrestSingleResponse<any>
): T[] {
  const { data, error } = response

  if (error) {
    logger.error("Database error:", { error })
    throw new Error(`Database operation failed: ${error.message}`)
  }

  return data as T[]
}

/**
 * Helper to safely handle database update/delete operations
 */
export function handleDatabaseMutationResponse<T>(
  response: PostgrestSingleResponse<any>,
  errorMessage: string = "Database operation failed"
): T | true {
  const { data, error } = response

  if (error) {
    logger.error("Database error:", { error })
    throw new Error(`${errorMessage}: ${error.message}`)
  }

  return data ? (data as T) : true
}
