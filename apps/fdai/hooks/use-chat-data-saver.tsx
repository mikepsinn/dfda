"use client"

import type React from "react"

import { useCallback } from "react"
import { logger } from "@/lib/logging"
import { saveUserGoalsAction, saveUserConditionsAction } from "@/app/actions/chat-actions"

// Create a hook-specific logger
const dataSaverLogger = logger.createChildLogger("ChatDataSaver")

export function useChatDataSaver(
  userId: string | undefined,
  setError: (error: string | null) => void,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
) {
  return useCallback(
    async (key: string, data: any) => {
      if (!userId) {
        dataSaverLogger.warn("Cannot save user data: No userId available")
        return
      }

      try {
        setError(null) // Clear any previous errors
        dataSaverLogger.info(`Saving user ${key}`, {
          data: { userId, dataType: key, dataPreview: Array.isArray(data) ? `${data.length} items` : typeof data },
        })

        if (key === "goals") {
          dataSaverLogger.debug(`Saving user goals`, {
            data: { goals: data },
          })

          const result = await saveUserGoalsAction(data)

          if (!result.success) {
            throw new Error(result.error || "Failed to save goals")
          }

          dataSaverLogger.info("Goals saved successfully")
        } else if (key === "conditions") {
          dataSaverLogger.debug(`Saving user conditions`, {
            data: { conditions: data },
          })

          const result = await saveUserConditionsAction(data)

          if (!result.success) {
            throw new Error(result.error || "Failed to save conditions")
          }

          dataSaverLogger.info("Conditions saved successfully")
        } else {
          // For other profile data - would need to create a server action for this
          dataSaverLogger.debug(`Updating user profile not implemented yet`, {
            data: { key, value: data },
          })
          setError(`Updating profile ${key} not implemented yet`)
        }
      } catch (error) {
        dataSaverLogger.error(`Error saving ${key}`, {
          data: { userId, key },
          error,
        })

        // Ensure we're converting the error to a string
        const errorMessage = error instanceof Error ? error.message : String(error)
        setError(`Failed to save ${key}: ${errorMessage}`)

        // Add error message to the messages array
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `
              <div class="text-red-500">
                <p>I'm sorry, but I encountered an error while saving your ${key}.</p>
                <p>This might be due to a database setup issue. Please try again later or contact support.</p>
                <p>Error details: ${errorMessage}</p>
              </div>
            `,
          },
        ])
      }
    },
    [userId, setError, setMessages],
  )
}
