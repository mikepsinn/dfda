export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string | null
          check_in_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          check_in_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          check_in_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      user_goals: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          priority: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          priority?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          priority?: number | null
          created_at?: string
        }
      }
      conditions: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          emoji: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          emoji?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string | null
          emoji?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      user_conditions: {
        Row: {
          id: string
          user_id: string
          condition_id: string
          severity: number | null
          diagnosed_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          condition_id: string
          severity?: number | null
          diagnosed_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          condition_id?: string
          severity?: number | null
          diagnosed_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
