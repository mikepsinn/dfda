"use client"

import { useRef, useEffect, useCallback } from "react"
import { MessageItem } from "./message-item"

interface ChatMessagesProps {
  messages: Array<{
    id: string
    role: "user" | "assistant"
    content: string
  }>
  saveUserData: (key: string, data: any) => Promise<void>
  append: (message: { role: "user" | "assistant"; content: string }) => void
  setActiveComponent: (component: string | null) => void
}

export function ChatMessages({ messages, saveUserData, append, setActiveComponent }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Debounced scroll function to avoid rapid layout changes
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // Use requestAnimationFrame to ensure we're not fighting with other layout operations
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    }
  }, [])

  useEffect(() => {
    // Add a small delay to ensure DOM has settled before scrolling
    const timeoutId = setTimeout(() => {
      scrollToBottom()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [messages, scrollToBottom])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef}>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          saveUserData={saveUserData}
          append={append}
          setActiveComponent={setActiveComponent}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
