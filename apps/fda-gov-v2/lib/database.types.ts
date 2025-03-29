export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      conditions: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          global_variable_id: string
          icd_code: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          global_variable_id: string
          icd_code?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          global_variable_id?: string
          icd_code?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conditions_global_variable_id_fkey"
            columns: ["global_variable_id"]
            isOneToOne: false
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conditions_global_variable_id_fkey"
            columns: ["global_variable_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["variable_id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string
          id: string
          inquiry_type: string
          message: string
          name: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email: string
          id?: string
          inquiry_type: string
          message: string
          name: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          inquiry_type?: string
          message?: string
          name?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_submissions: {
        Row: {
          created_at: string | null
          data: Json
          deleted_at: string | null
          enrollment_id: string
          id: string
          patient_id: string
          review_date: string | null
          review_notes: string | null
          reviewed_by: string | null
          status: string
          submission_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          deleted_at?: string | null
          enrollment_id: string
          id?: string
          patient_id: string
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status: string
          submission_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          deleted_at?: string | null
          enrollment_id?: string
          id?: string
          patient_id?: string
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          submission_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_submissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "trial_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_submissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_variables: {
        Row: {
          created_at: string | null
          default_unit_id: string | null
          deleted_at: string | null
          description: string | null
          emoji: string | null
          id: string
          name: string
          updated_at: string | null
          variable_category_id: string
        }
        Insert: {
          created_at?: string | null
          default_unit_id?: string | null
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id: string
          name: string
          updated_at?: string | null
          variable_category_id: string
        }
        Update: {
          created_at?: string | null
          default_unit_id?: string | null
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          variable_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_variables_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_variables_variable_category_id_fkey"
            columns: ["variable_category_id"]
            isOneToOne: false
            referencedRelation: "variable_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          end_at: string | null
          id: string
          notes: string | null
          start_at: string
          unit_id: string
          updated_at: string | null
          user_id: string
          user_variable_id: string | null
          value: number
          variable_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          end_at?: string | null
          id?: string
          notes?: string | null
          start_at: string
          unit_id: string
          updated_at?: string | null
          user_id: string
          user_variable_id?: string | null
          value: number
          variable_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          end_at?: string | null
          id?: string
          notes?: string | null
          start_at?: string
          unit_id?: string
          updated_at?: string | null
          user_id?: string
          user_variable_id?: string | null
          value?: number
          variable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurements_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_user_variable_id_fkey"
            columns: ["user_variable_id"]
            isOneToOne: false
            referencedRelation: "user_variables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_variable_id_fkey"
            columns: ["variable_id"]
            isOneToOne: false
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_variable_id_fkey"
            columns: ["variable_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["variable_id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          scheduled_for: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_access_tokens: {
        Row: {
          client_id: string
          created_at: string | null
          expires_at: string
          revoked_at: string | null
          scope: string | null
          token: string
          user_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expires_at: string
          revoked_at?: string | null
          scope?: string | null
          token: string
          user_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expires_at?: string
          revoked_at?: string | null
          scope?: string | null
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_access_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      oauth_authorization_codes: {
        Row: {
          client_id: string
          code: string
          created_at: string | null
          expires_at: string
          redirect_uri: string
          scope: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          code: string
          created_at?: string | null
          expires_at: string
          redirect_uri: string
          scope?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          code?: string
          created_at?: string | null
          expires_at?: string
          redirect_uri?: string
          scope?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorization_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      oauth_clients: {
        Row: {
          client_id: string
          client_name: string
          client_secret: string
          client_uri: string | null
          created_at: string | null
          grant_types: string[]
          logo_uri: string | null
          owner_id: string | null
          policy_uri: string | null
          redirect_uris: string[]
          response_types: string[]
          scope: string | null
          tos_uri: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          client_name: string
          client_secret: string
          client_uri?: string | null
          created_at?: string | null
          grant_types?: string[]
          logo_uri?: string | null
          owner_id?: string | null
          policy_uri?: string | null
          redirect_uris: string[]
          response_types?: string[]
          scope?: string | null
          tos_uri?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          client_name?: string
          client_secret?: string
          client_uri?: string | null
          created_at?: string | null
          grant_types?: string[]
          logo_uri?: string | null
          owner_id?: string | null
          policy_uri?: string | null
          redirect_uris?: string[]
          response_types?: string[]
          scope?: string | null
          tos_uri?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_clients_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_refresh_tokens: {
        Row: {
          access_token: string
          client_id: string
          created_at: string | null
          expires_at: string
          revoked_at: string | null
          scope: string | null
          token: string
          user_id: string
        }
        Insert: {
          access_token: string
          client_id: string
          created_at?: string | null
          expires_at: string
          revoked_at?: string | null
          scope?: string | null
          token: string
          user_id: string
        }
        Update: {
          access_token?: string
          client_id?: string
          created_at?: string | null
          expires_at?: string
          revoked_at?: string | null
          scope?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_refresh_tokens_access_token_fkey"
            columns: ["access_token"]
            isOneToOne: false
            referencedRelation: "oauth_access_tokens"
            referencedColumns: ["token"]
          },
          {
            foreignKeyName: "oauth_refresh_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      oauth_scopes: {
        Row: {
          created_at: string | null
          description: string
          is_default: boolean | null
          scope: string
        }
        Insert: {
          created_at?: string | null
          description: string
          is_default?: boolean | null
          scope: string
        }
        Update: {
          created_at?: string | null
          description?: string
          is_default?: boolean | null
          scope?: string
        }
        Relationships: []
      }
      patient_conditions: {
        Row: {
          condition_id: string
          created_at: string | null
          deleted_at: string | null
          diagnosing_doctor_id: string | null
          diagnosis_date: string
          end_date: string | null
          id: string
          notes: string | null
          patient_id: string
          severity: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          condition_id: string
          created_at?: string | null
          deleted_at?: string | null
          diagnosing_doctor_id?: string | null
          diagnosis_date: string
          end_date?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          severity?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          condition_id?: string
          created_at?: string | null
          deleted_at?: string | null
          diagnosing_doctor_id?: string | null
          diagnosis_date?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          severity?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_conditions_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_conditions_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["condition_id"]
          },
          {
            foreignKeyName: "patient_conditions_diagnosing_doctor_id_fkey"
            columns: ["diagnosing_doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          blood_type: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          height: number | null
          id: string
          insurance_id: string | null
          insurance_provider: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          blood_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          height?: number | null
          id: string
          insurance_id?: string | null
          insurance_provider?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          blood_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          insurance_id?: string | null
          insurance_provider?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contact_name: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          organization_name: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          organization_name?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_name?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      treatment_effectiveness: {
        Row: {
          condition_id: string
          cost_effectiveness_score: number
          created_at: string | null
          deleted_at: string | null
          effectiveness_score: number
          evidence_level: string
          id: string
          side_effects_score: number
          treatment_id: string
          updated_at: string | null
        }
        Insert: {
          condition_id: string
          cost_effectiveness_score: number
          created_at?: string | null
          deleted_at?: string | null
          effectiveness_score: number
          evidence_level: string
          id?: string
          side_effects_score: number
          treatment_id: string
          updated_at?: string | null
        }
        Update: {
          condition_id?: string
          cost_effectiveness_score?: number
          created_at?: string | null
          deleted_at?: string | null
          effectiveness_score?: number
          evidence_level?: string
          id?: string
          side_effects_score?: number
          treatment_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_effectiveness_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_effectiveness_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["condition_id"]
          },
          {
            foreignKeyName: "treatment_effectiveness_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments_view"
            referencedColumns: ["treatment_id"]
          },
          {
            foreignKeyName: "treatment_effectiveness_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_ratings: {
        Row: {
          condition_id: string
          created_at: string
          id: string
          rating: number
          review: string | null
          treatment_id: string
          updated_at: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          condition_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          treatment_id: string
          updated_at?: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          condition_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          treatment_id?: string
          updated_at?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_ratings_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_ratings_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["condition_id"]
          },
          {
            foreignKeyName: "treatment_ratings_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments_view"
            referencedColumns: ["treatment_id"]
          },
          {
            foreignKeyName: "treatment_ratings_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_side_effect_ratings: {
        Row: {
          condition_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          notes: string | null
          severity_rating: number
          side_effect_variable_id: string
          treatment_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          condition_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          severity_rating: number
          side_effect_variable_id: string
          treatment_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          condition_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          severity_rating?: number
          side_effect_variable_id?: string
          treatment_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_side_effect_ratings_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_side_effect_ratings_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["condition_id"]
          },
          {
            foreignKeyName: "treatment_side_effect_ratings_side_effect_variable_id_fkey"
            columns: ["side_effect_variable_id"]
            isOneToOne: false
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_side_effect_ratings_side_effect_variable_id_fkey"
            columns: ["side_effect_variable_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["variable_id"]
          },
          {
            foreignKeyName: "treatment_side_effect_ratings_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments_view"
            referencedColumns: ["treatment_id"]
          },
          {
            foreignKeyName: "treatment_side_effect_ratings_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_side_effect_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          approval_status: string
          created_at: string | null
          deleted_at: string | null
          global_variable_id: string
          id: string
          manufacturer: string | null
          treatment_type: string
          updated_at: string | null
        }
        Insert: {
          approval_status: string
          created_at?: string | null
          deleted_at?: string | null
          global_variable_id: string
          id: string
          manufacturer?: string | null
          treatment_type: string
          updated_at?: string | null
        }
        Update: {
          approval_status?: string
          created_at?: string | null
          deleted_at?: string | null
          global_variable_id?: string
          id?: string
          manufacturer?: string | null
          treatment_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatments_global_variable_id_fkey"
            columns: ["global_variable_id"]
            isOneToOne: false
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_global_variable_id_fkey"
            columns: ["global_variable_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["variable_id"]
          },
        ]
      }
      trial_enrollments: {
        Row: {
          completion_date: string | null
          created_at: string | null
          deleted_at: string | null
          doctor_id: string | null
          enrollment_date: string
          id: string
          notes: string | null
          patient_id: string
          status: string
          trial_id: string
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          enrollment_date: string
          id?: string
          notes?: string | null
          patient_id: string
          status: string
          trial_id: string
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          enrollment_date?: string
          id?: string
          notes?: string | null
          patient_id?: string
          status?: string
          trial_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_enrollments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_enrollments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_enrollments_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "patient_eligible_trials"
            referencedColumns: ["trial_id"]
          },
          {
            foreignKeyName: "trial_enrollments_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "trials"
            referencedColumns: ["id"]
          },
        ]
      }
      trials: {
        Row: {
          compensation: number | null
          condition_id: string
          created_at: string | null
          current_enrollment: number | null
          deleted_at: string | null
          description: string
          end_date: string | null
          enrollment_target: number
          exclusion_criteria: Json | null
          id: string
          inclusion_criteria: Json | null
          location: string | null
          phase: string
          sponsor_id: string
          start_date: string
          status: string
          title: string
          treatment_id: string
          updated_at: string | null
        }
        Insert: {
          compensation?: number | null
          condition_id: string
          created_at?: string | null
          current_enrollment?: number | null
          deleted_at?: string | null
          description: string
          end_date?: string | null
          enrollment_target: number
          exclusion_criteria?: Json | null
          id?: string
          inclusion_criteria?: Json | null
          location?: string | null
          phase: string
          sponsor_id: string
          start_date: string
          status: string
          title: string
          treatment_id: string
          updated_at?: string | null
        }
        Update: {
          compensation?: number | null
          condition_id?: string
          created_at?: string | null
          current_enrollment?: number | null
          deleted_at?: string | null
          description?: string
          end_date?: string | null
          enrollment_target?: number
          exclusion_criteria?: Json | null
          id?: string
          inclusion_criteria?: Json | null
          location?: string | null
          phase?: string
          sponsor_id?: string
          start_date?: string
          status?: string
          title?: string
          treatment_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trials_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trials_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["condition_id"]
          },
          {
            foreignKeyName: "trials_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trials_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments_view"
            referencedColumns: ["treatment_id"]
          },
          {
            foreignKeyName: "trials_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_categories: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          emoji: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          abbreviation: string
          conversion_factor: number | null
          conversion_offset: number | null
          created_at: string | null
          deleted_at: string | null
          emoji: string | null
          id: string
          is_default: boolean | null
          name: string
          unit_category_id: string
          updated_at: string | null
        }
        Insert: {
          abbreviation: string
          conversion_factor?: number | null
          conversion_offset?: number | null
          created_at?: string | null
          deleted_at?: string | null
          emoji?: string | null
          id: string
          is_default?: boolean | null
          name: string
          unit_category_id: string
          updated_at?: string | null
        }
        Update: {
          abbreviation?: string
          conversion_factor?: number | null
          conversion_offset?: number | null
          created_at?: string | null
          deleted_at?: string | null
          emoji?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          unit_category_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_unit_category_id_fkey"
            columns: ["unit_category_id"]
            isOneToOne: false
            referencedRelation: "unit_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_variables: {
        Row: {
          created_at: string | null
          custom_recurrence_rule: string | null
          deleted_at: string | null
          id: string
          reminder_days: number[] | null
          reminder_enabled: boolean | null
          reminder_end_date: string | null
          reminder_frequency: string | null
          reminder_interval: number | null
          reminder_start_date: string | null
          reminder_times: string[] | null
          updated_at: string | null
          user_default_unit_id: string | null
          user_id: string
          variable_id: string
        }
        Insert: {
          created_at?: string | null
          custom_recurrence_rule?: string | null
          deleted_at?: string | null
          id?: string
          reminder_days?: number[] | null
          reminder_enabled?: boolean | null
          reminder_end_date?: string | null
          reminder_frequency?: string | null
          reminder_interval?: number | null
          reminder_start_date?: string | null
          reminder_times?: string[] | null
          updated_at?: string | null
          user_default_unit_id?: string | null
          user_id: string
          variable_id: string
        }
        Update: {
          created_at?: string | null
          custom_recurrence_rule?: string | null
          deleted_at?: string | null
          id?: string
          reminder_days?: number[] | null
          reminder_enabled?: boolean | null
          reminder_end_date?: string | null
          reminder_frequency?: string | null
          reminder_interval?: number | null
          reminder_start_date?: string | null
          reminder_times?: string[] | null
          updated_at?: string | null
          user_default_unit_id?: string | null
          user_id?: string
          variable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_variables_user_default_unit_id_fkey"
            columns: ["user_default_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_variables_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_variables_variable_id_fkey"
            columns: ["variable_id"]
            isOneToOne: false
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_variables_variable_id_fkey"
            columns: ["variable_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["variable_id"]
          },
        ]
      }
      variable_categories: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          display_order: number
          emoji: string
          id: string
          long_description: string
          name: string
          short_description: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          display_order?: number
          emoji: string
          id: string
          long_description: string
          name: string
          short_description: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          display_order?: number
          emoji?: string
          id?: string
          long_description?: string
          name?: string
          short_description?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      patient_conditions_view: {
        Row: {
          condition_id: string | null
          condition_name: string | null
          description: string | null
          diagnosed_at: string | null
          icd_code: string | null
          measurement_count: number | null
          patient_id: string | null
          variable_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_user_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_eligible_trials: {
        Row: {
          condition_name: string | null
          current_enrollment: number | null
          description: string | null
          end_date: string | null
          enrollment_target: number | null
          patient_id: string | null
          phase: string | null
          start_date: string | null
          status: string | null
          title: string | null
          treatment_name: string | null
          trial_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_treatments_view: {
        Row: {
          approval_status: string | null
          end_at: string | null
          manufacturer: string | null
          measurement_id: string | null
          notes: string | null
          start_at: string | null
          treatment_id: string | null
          treatment_type: string | null
          unit_abbreviation: string | null
          unit_name: string | null
          user_id: string | null
          value: number | null
          variable_description: string | null
          variable_id: string | null
          variable_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_variable_id_fkey"
            columns: ["variable_id"]
            isOneToOne: false
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_variable_id_fkey"
            columns: ["variable_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["variable_id"]
          },
        ]
      }
    }
    Functions: {
      convert_measurement_value: {
        Args: {
          p_value: number
          p_from_unit_id: string
          p_to_unit_id: string
        }
        Returns: number
      }
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
      restore_soft_deleted_record: {
        Args: {
          p_table_name: string
          p_record_id: string
        }
        Returns: boolean
      }
      soft_delete_record: {
        Args: {
          p_table_name: string
          p_record_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: {
          _bucket_id: string
          _name: string
        }
        Returns: undefined
      }
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      delete_prefix: {
        Args: {
          _bucket_id: string
          _name: string
        }
        Returns: boolean
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_level: {
        Args: {
          name: string
        }
        Returns: number
      }
      get_prefix: {
        Args: {
          name: string
        }
        Returns: string
      }
      get_prefixes: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_legacy_v1: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_v1_optimised: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_v2: {
        Args: {
          prefix: string
          bucket_name: string
          limits?: number
          levels?: number
          start_after?: string
        }
        Returns: {
          key: string
          name: string
          id: string
          updated_at: string
          created_at: string
          metadata: Json
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
  storage: {
    Enums: {},
  },
} as const

