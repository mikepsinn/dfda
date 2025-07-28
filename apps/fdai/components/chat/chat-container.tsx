"use client"

import type React from "react"

import { useChat } from "ai/react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { logger } from "@/lib/logging"
import { suppressResizeObserverErrors } from "@/lib/debug/resize-observer-monitor"
import { ChatHeader } from "./chat-header"
import { ErrorDisplay } from "./error-display"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { useChatDataSaver } from "@/hooks/use-chat-data-saver"

// Update the ChatContainer component to accept the debug tool trigger props

// Add these props to the component definition:
interface ChatContainerProps {
  onShowApiTester?: () => void
  onShowOpenAILogs?: () => void
  onShowAdminLogin?: () => void
}

// Create a component-specific logger
const chatContainerLogger = logger.createChildLogger("ChatContainer")

// Update the function signature:
export function ChatContainer({ onShowApiTester, onShowOpenAILogs, onShowAdminLogin }: ChatContainerProps = {}) {
  const { user } = useAuth()
  const userId = user?.id

  // Track component mount state
  const isMounted = useRef(true)
  const [error, setError] = useState<string | null>(null)
  const [activeComponent, setActiveComponent] = useState<string | null>(null)

  // Initialize error suppression for production
  useEffect(() => {
    suppressResizeObserverErrors()
    return () => {
      isMounted.current = false
    }
  }, [])

  // Create an error handler function
  const handleChatError = useCallback((error: Error) => {
    // Error handling logic...
  }, [])

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    error: chatError,
    setError: setChatError,
    setMessages,
  } = useChat({
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content: `
      <div class="space-y-4">
        <h2 class="text-xl font-bold">Welcome to FDAi Health Insights</h2>
        <p>I'm your personal health assistant, designed to help you discover exactly how your diet, medications, and lifestyle impact your chronic conditions.</p>
        <p>With FDAi, you can:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Identify which foods trigger your symptoms</li>
          <li>Track how medications interact with your diet</li>
          <li>Discover patterns between your lifestyle and health outcomes</li>
          <li>Receive personalized recommendations based on your data</li>
        </ul>
        <p>Let's start by identifying what health outcomes you'd like to focus on. Please select your goals below:</p>
      </div>
    `,
        toolCall: {
          name: "displayGoalSelector",
          args: {
            message: "Select the health outcomes you'd like to focus on",
          },
          result: {
            componentType: "goal-selector",
            message: "Select the health outcomes you'd like to focus on",
          },
        },
      },
    ],
    body: {
      userId: userId,
    },
    api: "/api/chat",
    onError: handleChatError,
  })

  // Use the custom hook for saving user data
  const saveUserData = useChatDataSaver(userId, setError, setMessages)

  // Custom submit handler with error handling
  const customSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Clear previous errors
      setError(null)
      setChatError(null)

      try {
        // Log the submission
        chatContainerLogger.info("Submitting user message", {
          data: {
            inputLength: input.length,
            userId: userId ? `${userId.substring(0, 8)}...` : "none",
          },
        })

        // Use the original handler
        await handleSubmit(e)
      } catch (submitError) {
        chatContainerLogger.error("Error in form submission", {
          error: submitError,
        })

        setError(
          `Error submitting message: ${submitError instanceof Error ? submitError.message : String(submitError)}`,
        )
      }
    },
    [handleSubmit, input, setChatError, userId],
  )

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader />

      {/* Error Displays */}
      <ErrorDisplay error={error} />
      <ErrorDisplay error={chatError ? String(chatError) : null} title="AI Assistant Error" />

      {/* Messages */}
      <ChatMessages
        messages={messages}
        saveUserData={saveUserData}
        append={append}
        setActiveComponent={setActiveComponent}
      />

      {/* Input */}
      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={customSubmit}
        isLoading={isLoading}
        append={append}
      />
    </div>
  )
}
