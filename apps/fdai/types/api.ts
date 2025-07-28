// API-related type definitions

/**
 * Standard API response structure
 */
export interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
  status: "success" | "error"
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  limit?: number
  cursor?: string
}

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    hasMore: boolean
    nextCursor?: string
  }
}

/**
 * File upload result
 */
export interface UploadedFile {
  id: string
  name: string
  url: string
  type: string
  size: number
}
