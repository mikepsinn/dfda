export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      conditions: {
        Row: {
          id: string
          name: string
          description: string
          icd_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icd_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icd_code?: string | null
          updated_at?: string
        }
      }
      treatments: {
        Row: {
          id: string
          name: string
          description: string
          treatment_type: string
          manufacturer: string | null
          approval_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          treatment_type: string
          manufacturer?: string | null
          approval_status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          treatment_type?: string
          manufacturer?: string | null
          approval_status?: string
          updated_at?: string
        }
      }
      treatment_effectiveness: {
        Row: {
          id: string
          treatment_id: string
          condition_id: string
          effectiveness_score: number
          side_effects_score: number
          cost_effectiveness_score: number
          evidence_level: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          treatment_id: string
          condition_id: string
          effectiveness_score: number
          side_effects_score: number
          cost_effectiveness_score: number
          evidence_level: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          treatment_id?: string
          condition_id?: string
          effectiveness_score?: number
          side_effects_score?: number
          cost_effectiveness_score?: number
          evidence_level?: string
          updated_at?: string
        }
      }
      treatment_ratings: {
        Row: {
          id: string
          user_id: string
          treatment_id: string
          condition_id: string
          rating: number
          review: string | null
          user_type: string
          verified: boolean
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          treatment_id: string
          condition_id: string
          rating: number
          review?: string | null
          user_type: string
          verified?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          treatment_id?: string
          condition_id?: string
          rating?: number
          review?: string | null
          user_type?: string
          verified?: boolean
          helpful_count?: number
          updated_at?: string
        }
      }
      trials: {
        Row: {
          id: string
          title: string
          description: string
          sponsor_id: string
          condition_id: string
          treatment_id: string
          status: string
          phase: string
          start_date: string
          end_date: string | null
          enrollment_target: number
          current_enrollment: number
          location: string | null
          compensation: number | null
          inclusion_criteria: Json | null
          exclusion_criteria: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          sponsor_id: string
          condition_id: string
          treatment_id: string
          status: string
          phase: string
          start_date: string
          end_date?: string | null
          enrollment_target: number
          current_enrollment?: number
          location?: string | null
          compensation?: number | null
          inclusion_criteria?: Json | null
          exclusion_criteria?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          sponsor_id?: string
          condition_id?: string
          treatment_id?: string
          status?: string
          phase?: string
          start_date?: string
          end_date?: string | null
          enrollment_target?: number
          current_enrollment?: number
          location?: string | null
          compensation?: number | null
          inclusion_criteria?: Json | null
          exclusion_criteria?: Json | null
          updated_at?: string
        }
      }
      trial_enrollments: {
        Row: {
          id: string
          trial_id: string
          patient_id: string
          doctor_id: string | null
          status: string
          enrollment_date: string
          completion_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trial_id: string
          patient_id: string
          doctor_id?: string | null
          status: string
          enrollment_date: string
          completion_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trial_id?: string
          patient_id?: string
          doctor_id?: string | null
          status?: string
          enrollment_date?: string
          completion_date?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      data_submissions: {
        Row: {
          id: string
          enrollment_id: string
          patient_id: string
          submission_date: string
          data: Json
          status: string
          reviewed_by: string | null
          review_date: string | null
          review_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          enrollment_id: string
          patient_id: string
          submission_date: string
          data: Json
          status: string
          reviewed_by?: string | null
          review_date?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          enrollment_id?: string
          patient_id?: string
          submission_date?: string
          data?: Json
          status?: string
          reviewed_by?: string | null
          review_date?: string | null
          review_notes?: string | null
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          organization_name: string | null
          contact_name: string | null
          user_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          organization_name?: string | null
          contact_name?: string | null
          user_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          organization_name?: string | null
          contact_name?: string | null
          user_type?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_average_treatment_rating: {
        Args: {
          p_treatment_id: string
          p_condition_id: string
        }
        Returns: {
          average: number
          count: number
        }[]
      }
      increment_helpful_count: {
        Args: {
          p_rating_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

