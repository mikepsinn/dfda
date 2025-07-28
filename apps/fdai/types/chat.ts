// Chat-related type definitions

/**
 * Chat message
 */
export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at?: string
}

/**
 * Chat conversation
 */
export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at?: string
  updated_at?: string
  messages?: ChatMessage[]
}

/**
 * UI component type for rendering in chat
 */
export type UIComponentType =
  | "goal-selector"
  | "condition-selector"
  | "symptom-tracker"
  | "meal-logger"
  | "medication-logger"
  | "none"

/**
 * Chat state
 */
export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  activeComponent: UIComponentType | null
  lastAssistantMessage: string
}

/**
 * Chat API request
 */
export interface ChatApiRequest {
  messages: ChatMessage[]
  userId?: string
}

/**
 * Chat API response
 */
export interface ChatApiResponse {
  id: string
  role: "assistant"
  content: string
}
