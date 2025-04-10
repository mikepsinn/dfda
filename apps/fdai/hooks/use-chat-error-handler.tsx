"use client"

import { useState, useCallback } from "react"
import { isDebugMode } from "@/lib/env"

export function useChatErrorHandler() {
  const [error, setError] = useState<any>(null)
  const debugMode = isDebugMode()

  const handleError = useCallback(
    (err: unknown) => {
      console.error("Chat error:", err)

      // Try to parse error from the response
      if (err instanceof Error) {
        setError({
          message: err.message,
          details: {
            name: err.name,
            stack: debugMode ? err.stack : undefined,
          },
        })
        return
      }

      // Handle response errors
      if (typeof err === "object" && err !== null) {
        try {
          // Try to extract structured error data
          const errorObj = err as any

          if (errorObj.message || errorObj.error) {
            setError({
              message: errorObj.message || errorObj.error || "Unknown error",
              type: errorObj.type || errorObj.code || undefined,
              details: debugMode
                ? {
                    ...errorObj,
                    message: undefined,
                    error: undefined,
                    type: undefined,
                  }
                : undefined,
            })
            return
          }

          // If we get here, try to stringify the object
          setError({
            message: JSON.stringify(err),
            details: debugMode ? err : undefined,
          })
        } catch (e) {
          setError({
            message: "An unexpected error occurred",
            details: debugMode ? { parseError: true, originalError: String(err) } : undefined,
          })
        }
        return
      }

      // Handle string errors
      if (typeof err === "string") {
        setError({ message: err })
        return
      }

      // Default fallback
      setError({
        message: "An unknown error occurred",
        details: debugMode ? { unknownErrorType: typeof err } : undefined,
      })
    },
    [debugMode],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}
