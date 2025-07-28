// User-related type definitions

/**
 * User profile information
 */
export interface UserProfile {
  id: string
  email?: string
  name?: string
  check_in_time?: string // Time in ISO format
  created_at?: string
  updated_at?: string
}

/**
 * User authentication state
 */
export interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  user: UserProfile | null
  error: string | null
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  id: string
  user_id: string
  web_enabled: boolean
  email_enabled: boolean
  phone_enabled: boolean
  daily_reminder_enabled: boolean
  insights_enabled: boolean
  created_at?: string
  updated_at?: string
}

/**
 * User goal
 */
export interface UserGoal {
  id?: string
  user_id: string
  goal_id?: string
  goal_name: string
  priority?: number
}

/**
 * User condition
 */
export interface UserCondition {
  id?: string
  user_id: string
  condition_id?: string
  condition_name: string
  severity?: number
  diagnosed_date?: string
  notes?: string
}
