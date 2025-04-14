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
      action_types: {
        Row: {
          can_be_recurring: boolean | null
          category: Database["public"]["Enums"]["action_category"]
          created_at: string | null
          default_duration_minutes: number | null
          deleted_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          requires_results: boolean | null
          requires_scheduling: boolean | null
          updated_at: string | null
        }
        Insert: {
          can_be_recurring?: boolean | null
          category: Database["public"]["Enums"]["action_category"]
          created_at?: string | null
          default_duration_minutes?: number | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          requires_results?: boolean | null
          requires_scheduling?: boolean | null
          updated_at?: string | null
        }
        Update: {
          can_be_recurring?: boolean | null
          category?: Database["public"]["Enums"]["action_category"]
          created_at?: string | null
          default_duration_minutes?: number | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          requires_results?: boolean | null
          requires_scheduling?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conditions: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          icd_code: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          icd_code?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          icd_code?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conditions_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          id: string
          message: string
          name: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_assigned_to_fkey"
            columns: ["assigned_to"]
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
            referencedRelation: "patients"
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
      form_answers: {
        Row: {
          answer_value: Json
          created_at: string
          id: string
          question_id: string
          submission_id: string
          updated_at: string
        }
        Insert: {
          answer_value: Json
          created_at?: string
          id?: string
          question_id: string
          submission_id: string
          updated_at?: string
        }
        Update: {
          answer_value?: Json
          created_at?: string
          id?: string
          question_id?: string
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "form_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_questions: {
        Row: {
          created_at: string
          description: string | null
          form_id: string
          id: string
          is_required: boolean
          options: Json | null
          order: number
          question_text: string
          type: Database["public"]["Enums"]["form_question_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          form_id: string
          id?: string
          is_required?: boolean
          options?: Json | null
          order: number
          question_text: string
          type: Database["public"]["Enums"]["form_question_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          form_id?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          order?: number
          question_text?: string
          type?: Database["public"]["Enums"]["form_question_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          created_at: string
          form_id: string
          id: string
          patient_id: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          patient_id: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          patient_id?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      global_variable_synonyms: {
        Row: {
          created_at: string
          global_variable_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          global_variable_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          global_variable_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_variable_synonyms_global_variable_id_fkey"
            columns: ["global_variable_id"]
            isOneToOne: false
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
        ]
      }
      global_variables: {
        Row: {
          canonical_global_variable_id: string | null
          created_at: string | null
          default_unit_id: string | null
          deleted_at: string | null
          description: string | null
          emoji: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string | null
          variable_category_id: string
        }
        Insert: {
          canonical_global_variable_id?: string | null
          created_at?: string | null
          default_unit_id?: string | null
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id: string
          image_url?: string | null
          name: string
          updated_at?: string | null
          variable_category_id: string
        }
        Update: {
          canonical_global_variable_id?: string | null
          created_at?: string | null
          default_unit_id?: string | null
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string | null
          variable_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_variables_canonical_global_variable_id_fkey"
            columns: ["canonical_global_variable_id"]
            isOneToOne: false
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
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
          global_variable_id: string
          id: string
          notes: string | null
          start_at: string
          unit_id: string
          updated_at: string | null
          user_id: string
          user_variable_id: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          end_at?: string | null
          global_variable_id: string
          id?: string
          notes?: string | null
          start_at: string
          unit_id: string
          updated_at?: string | null
          user_id: string
          user_variable_id?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          end_at?: string | null
          global_variable_id?: string
          id?: string
          notes?: string | null
          start_at?: string
          unit_id?: string
          updated_at?: string | null
          user_id?: string
          user_variable_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "measurements_global_variable_id_fkey"
            columns: ["global_variable_id"]
            isOneToOne: false
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
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
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          emoji: string | null
          id: string
          image_url: string | null
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
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
          id: string
          revoked_at: string | null
          scope: string
          token: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          revoked_at?: string | null
          scope: string
          token: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          revoked_at?: string | null
          scope?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_access_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_access_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          deleted_at: string | null
          grant_types: string[]
          id: string
          logo_uri: string | null
          owner_id: string
          policy_uri: string | null
          redirect_uris: string[]
          response_types: string[]
          scope: string
          tos_uri: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          client_name: string
          client_secret: string
          client_uri?: string | null
          created_at?: string | null
          deleted_at?: string | null
          grant_types: string[]
          id?: string
          logo_uri?: string | null
          owner_id: string
          policy_uri?: string | null
          redirect_uris: string[]
          response_types: string[]
          scope: string
          tos_uri?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          client_name?: string
          client_secret?: string
          client_uri?: string | null
          created_at?: string | null
          deleted_at?: string | null
          grant_types?: string[]
          id?: string
          logo_uri?: string | null
          owner_id?: string
          policy_uri?: string | null
          redirect_uris?: string[]
          response_types?: string[]
          scope?: string
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
          access_token_id: string
          client_id: string
          created_at: string | null
          expires_at: string
          id: string
          revoked_at: string | null
          scope: string
          token: string
          user_id: string
        }
        Insert: {
          access_token_id: string
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          revoked_at?: string | null
          scope: string
          token: string
          user_id: string
        }
        Update: {
          access_token_id?: string
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          revoked_at?: string | null
          scope?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_refresh_tokens_access_token_id_fkey"
            columns: ["access_token_id"]
            isOneToOne: false
            referencedRelation: "oauth_access_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_refresh_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_scopes: {
        Row: {
          description: string | null
          scope: string
        }
        Insert: {
          description?: string | null
          scope: string
        }
        Update: {
          description?: string | null
          scope?: string
        }
        Relationships: []
      }
      patient_conditions: {
        Row: {
          condition_id: string
          created_at: string | null
          deleted_at: string | null
          diagnosed_at: string | null
          id: string
          notes: string | null
          patient_id: string
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          condition_id: string
          created_at?: string | null
          deleted_at?: string | null
          diagnosed_at?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          condition_id?: string
          created_at?: string | null
          deleted_at?: string | null
          diagnosed_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          severity?: string | null
          status?: string | null
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
            foreignKeyName: "patient_conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_treatments: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_prescribed: boolean
          patient_id: string
          patient_notes: string | null
          start_date: string | null
          status: string
          treatment_id: string
          updated_at: string | null
          user_variable_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_prescribed?: boolean
          patient_id: string
          patient_notes?: string | null
          start_date?: string | null
          status?: string
          treatment_id: string
          updated_at?: string | null
          user_variable_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_prescribed?: boolean
          patient_id?: string
          patient_notes?: string | null
          start_date?: string | null
          status?: string
          treatment_id?: string
          updated_at?: string | null
          user_variable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_user_variable_id_fkey"
            columns: ["user_variable_id"]
            isOneToOne: false
            referencedRelation: "user_variables"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          gender: string | null
          height: number | null
          id: string
          medications: string[] | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          gender?: string | null
          height?: number | null
          id: string
          medications?: string[] | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          medications?: string[] | null
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
      pharmacies: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          allow_substitutions: boolean | null
          created_at: string | null
          dosage_amount: number | null
          dosage_form: string | null
          dosage_unit: string | null
          duration_days: number | null
          frequency: string | null
          id: string
          patient_treatment_id: string
          pharmacy_id: string | null
          prescriber_notes: string | null
          prescription_date: string
          provider_id: string
          quantity_to_dispense: string
          refills_authorized: number
          route: string | null
          sig: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          allow_substitutions?: boolean | null
          created_at?: string | null
          dosage_amount?: number | null
          dosage_form?: string | null
          dosage_unit?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          patient_treatment_id: string
          pharmacy_id?: string | null
          prescriber_notes?: string | null
          prescription_date?: string
          provider_id: string
          quantity_to_dispense: string
          refills_authorized?: number
          route?: string | null
          sig?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          allow_substitutions?: boolean | null
          created_at?: string | null
          dosage_amount?: number | null
          dosage_form?: string | null
          dosage_unit?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          patient_treatment_id?: string
          pharmacy_id?: string | null
          prescriber_notes?: string | null
          prescription_date?: string
          provider_id?: string
          quantity_to_dispense?: string
          refills_authorized?: number
          route?: string | null
          sig?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_treatment_id_fkey"
            columns: ["patient_treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          timezone: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_role_enum"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_role_enum"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_role_enum"] | null
        }
        Relationships: []
      }
      protocol_versions: {
        Row: {
          approved_by: string | null
          created_at: string | null
          deleted_at: string | null
          effective_date: string | null
          id: string
          metadata: Json | null
          schedule: Json
          status: string
          trial_id: string
          updated_at: string | null
          version_number: number
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          deleted_at?: string | null
          effective_date?: string | null
          id?: string
          metadata?: Json | null
          schedule: Json
          status: string
          trial_id: string
          updated_at?: string | null
          version_number: number
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          deleted_at?: string | null
          effective_date?: string | null
          id?: string
          metadata?: Json | null
          schedule?: Json
          status?: string
          trial_id?: string
          updated_at?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "protocol_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_versions_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "patient_eligible_trials_view"
            referencedColumns: ["trial_id"]
          },
          {
            foreignKeyName: "protocol_versions_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "trials"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          created_at: string | null
          credentials: string | null
          id: string
          license_number: string | null
          license_state: string | null
          npi_number: string | null
          office_address: string | null
          office_phone: string | null
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credentials?: string | null
          id: string
          license_number?: string | null
          license_state?: string | null
          npi_number?: string | null
          office_address?: string | null
          office_phone?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credentials?: string | null
          id?: string
          license_number?: string | null
          license_state?: string | null
          npi_number?: string | null
          office_address?: string | null
          office_phone?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_approvals: {
        Row: {
          agency: string
          created_at: string | null
          decision_date: string | null
          deleted_at: string | null
          id: string
          indication: string | null
          notes: string | null
          region: string
          status: string
          treatment_id: string
          updated_at: string | null
        }
        Insert: {
          agency: string
          created_at?: string | null
          decision_date?: string | null
          deleted_at?: string | null
          id?: string
          indication?: string | null
          notes?: string | null
          region: string
          status: string
          treatment_id: string
          updated_at?: string | null
        }
        Update: {
          agency?: string
          created_at?: string | null
          decision_date?: string | null
          deleted_at?: string | null
          id?: string
          indication?: string | null
          notes?: string | null
          region?: string
          status?: string
          treatment_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_approvals_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_schedules: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean
          next_trigger_at: string | null
          notification_message_template: string | null
          notification_title_template: string | null
          rrule: string
          start_date: string
          time_of_day: string
          timezone: string
          updated_at: string | null
          user_id: string
          user_variable_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          next_trigger_at?: string | null
          notification_message_template?: string | null
          notification_title_template?: string | null
          rrule: string
          start_date?: string
          time_of_day: string
          timezone: string
          updated_at?: string | null
          user_id: string
          user_variable_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          next_trigger_at?: string | null
          notification_message_template?: string | null
          notification_title_template?: string | null
          rrule?: string
          start_date?: string
          time_of_day?: string
          timezone?: string
          updated_at?: string | null
          user_id?: string
          user_variable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_schedules_user_variable_id_fkey"
            columns: ["user_variable_id"]
            isOneToOne: false
            referencedRelation: "user_variables"
            referencedColumns: ["id"]
          },
        ]
      }
      reported_side_effects: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string
          id: string
          patient_treatment_id: string
          severity_out_of_ten: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description: string
          id?: string
          patient_treatment_id: string
          severity_out_of_ten?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string
          id?: string
          patient_treatment_id?: string
          severity_out_of_ten?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reported_side_effects_patient_treatment_id_fkey"
            columns: ["patient_treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      research_partners: {
        Row: {
          contact_email: string | null
          created_at: string | null
          department: string | null
          id: string
          institution_name: string
          is_institution: boolean
          research_focus_areas: string[] | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string | null
          department?: string | null
          id: string
          institution_name: string
          is_institution?: boolean
          research_focus_areas?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          institution_name?: string
          is_institution?: boolean
          research_focus_areas?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_partners_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_ratings: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          effectiveness_out_of_ten: number | null
          helpful_count: number | null
          id: string
          patient_condition_id: string
          patient_treatment_id: string
          review: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          effectiveness_out_of_ten?: number | null
          helpful_count?: number | null
          id?: string
          patient_condition_id: string
          patient_treatment_id: string
          review?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          effectiveness_out_of_ten?: number | null
          helpful_count?: number | null
          id?: string
          patient_condition_id?: string
          patient_treatment_id?: string
          review?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_ratings_patient_condition_id_fkey"
            columns: ["patient_condition_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_ratings_patient_condition_id_fkey"
            columns: ["patient_condition_id"]
            isOneToOne: false
            referencedRelation: "patient_conditions_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_ratings_patient_treatment_id_fkey"
            columns: ["patient_treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          manufacturer: string | null
          treatment_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id: string
          manufacturer?: string | null
          treatment_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          manufacturer?: string | null
          treatment_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatments_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_actions: {
        Row: {
          action_type_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          due_date: string
          enrollment_id: string
          id: string
          is_protocol_required: boolean | null
          metadata: Json | null
          parent_action_id: string | null
          priority: string
          protocol_version_id: string | null
          scheduled_date: string | null
          status: string
          title: string
          trial_id: string
          updated_at: string | null
        }
        Insert: {
          action_type_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date: string
          enrollment_id: string
          id?: string
          is_protocol_required?: boolean | null
          metadata?: Json | null
          parent_action_id?: string | null
          priority?: string
          protocol_version_id?: string | null
          scheduled_date?: string | null
          status: string
          title: string
          trial_id: string
          updated_at?: string | null
        }
        Update: {
          action_type_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string
          enrollment_id?: string
          id?: string
          is_protocol_required?: boolean | null
          metadata?: Json | null
          parent_action_id?: string | null
          priority?: string
          protocol_version_id?: string | null
          scheduled_date?: string | null
          status?: string
          title?: string
          trial_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_actions_action_type_id_fkey"
            columns: ["action_type_id"]
            isOneToOne: false
            referencedRelation: "action_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_actions_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_actions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_actions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "trial_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_actions_parent_action_id_fkey"
            columns: ["parent_action_id"]
            isOneToOne: false
            referencedRelation: "pending_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_actions_parent_action_id_fkey"
            columns: ["parent_action_id"]
            isOneToOne: false
            referencedRelation: "trial_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_actions_protocol_version_id_fkey"
            columns: ["protocol_version_id"]
            isOneToOne: false
            referencedRelation: "protocol_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_actions_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "patient_eligible_trials_view"
            referencedColumns: ["trial_id"]
          },
          {
            foreignKeyName: "trial_actions_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "trials"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_enrollments: {
        Row: {
          completion_date: string | null
          created_at: string | null
          deleted_at: string | null
          enrollment_date: string | null
          id: string
          notes: string | null
          patient_id: string
          provider_id: string
          status: string
          trial_id: string
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          deleted_at?: string | null
          enrollment_date?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          provider_id: string
          status: string
          trial_id: string
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          deleted_at?: string | null
          enrollment_date?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          provider_id?: string
          status?: string
          trial_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_enrollments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_enrollments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_enrollments_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "patient_eligible_trials_view"
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
          description: string | null
          end_date: string | null
          enrollment_target: number | null
          exclusion_criteria: string[] | null
          id: string
          inclusion_criteria: string[] | null
          location: string | null
          phase: string | null
          research_partner_id: string
          start_date: string | null
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
          description?: string | null
          end_date?: string | null
          enrollment_target?: number | null
          exclusion_criteria?: string[] | null
          id?: string
          inclusion_criteria?: string[] | null
          location?: string | null
          phase?: string | null
          research_partner_id: string
          start_date?: string | null
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
          description?: string | null
          end_date?: string | null
          enrollment_target?: number | null
          exclusion_criteria?: string[] | null
          id?: string
          inclusion_criteria?: string[] | null
          location?: string | null
          phase?: string | null
          research_partner_id?: string
          start_date?: string | null
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
            foreignKeyName: "trials_research_partner_id_fkey"
            columns: ["research_partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          base_unit_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          emoji: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          base_unit_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id: string
          image_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          base_unit_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_unit_categories_base_unit"
            columns: ["base_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          abbreviated_name: string
          conversion_factor: number
          conversion_offset: number
          created_at: string | null
          emoji: string | null
          id: string
          image_url: string | null
          name: string
          ucum_code: string | null
          unit_category_id: string
          updated_at: string | null
        }
        Insert: {
          abbreviated_name: string
          conversion_factor: number
          conversion_offset?: number
          created_at?: string | null
          emoji?: string | null
          id: string
          image_url?: string | null
          name: string
          ucum_code?: string | null
          unit_category_id: string
          updated_at?: string | null
        }
        Update: {
          abbreviated_name?: string
          conversion_factor?: number
          conversion_offset?: number
          created_at?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          name?: string
          ucum_code?: string | null
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
      uploaded_files: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          updated_at: string
          uploader_user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          size_bytes: number
          storage_path: string
          updated_at?: string
          uploader_user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          uploader_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_files_uploader_user_id_fkey"
            columns: ["uploader_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_variables: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          global_variable_id: string
          id: string
          preferred_unit_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          global_variable_id: string
          id?: string
          preferred_unit_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          global_variable_id?: string
          id?: string
          preferred_unit_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_variables_global_variable_id_fkey"
            columns: ["global_variable_id"]
            isOneToOne: false
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_variables_preferred_unit_id_fkey"
            columns: ["preferred_unit_id"]
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
        ]
      }
      variable_categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          emoji: string | null
          id: string
          image_url: string | null
          long_description: string | null
          name: string
          short_description: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          emoji?: string | null
          id: string
          image_url?: string | null
          long_description?: string | null
          name: string
          short_description?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          long_description?: string | null
          name?: string
          short_description?: string | null
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
          id: string | null
          measurement_count: number | null
          notes: string | null
          patient_id: string | null
          severity: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conditions_id_fkey"
            columns: ["condition_id"]
            isOneToOne: true
            referencedRelation: "global_variables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_eligible_trials_view: {
        Row: {
          condition_name: string | null
          current_enrollment: number | null
          description: string | null
          end_date: string | null
          enrollment_target: number | null
          manufacturer: string | null
          patient_id: string | null
          phase: string | null
          research_partner_first_name: string | null
          research_partner_last_name: string | null
          start_date: string | null
          status: string | null
          title: string | null
          treatment_name: string | null
          treatment_type: string | null
          trial_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_actions: {
        Row: {
          action_category: Database["public"]["Enums"]["action_category"] | null
          action_type: string | null
          description: string | null
          due_date: string | null
          enrollment_id: string | null
          id: string | null
          is_protocol_required: boolean | null
          patient_name: string | null
          priority: string | null
          protocol_version: number | null
          provider_name: string | null
          scheduled_date: string | null
          status: string | null
          title: string | null
          trial_id: string | null
          trial_title: string | null
          urgency: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_actions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "trial_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_actions_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "patient_eligible_trials_view"
            referencedColumns: ["trial_id"]
          },
          {
            foreignKeyName: "trial_actions_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "trials"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_ratings_stats: {
        Row: {
          average_effectiveness: number | null
          condition_id: string | null
          negative_ratings_count: number | null
          neutral_ratings_count: number | null
          positive_ratings_count: number | null
          total_ratings: number | null
          treatment_id: string | null
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
            foreignKeyName: "patient_treatments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      convert_measurement_value: {
        Args: { p_value: number; p_from_unit_id: string; p_to_unit_id: string }
        Returns: number
      }
      generate_protocol_actions: {
        Args: { enrollment_id: string; protocol_version_id?: string }
        Returns: {
          action_type_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          due_date: string
          enrollment_id: string
          id: string
          is_protocol_required: boolean | null
          metadata: Json | null
          parent_action_id: string | null
          priority: string
          protocol_version_id: string | null
          scheduled_date: string | null
          status: string
          title: string
          trial_id: string
          updated_at: string | null
        }[]
      }
      get_average_treatment_rating: {
        Args: { p_treatment_id: string; p_condition_id: string }
        Returns: {
          avg_effectiveness: number
          avg_side_effects: number
          total_ratings: number
        }[]
      }
      increment_helpful_count: {
        Args: { p_rating_id: string }
        Returns: undefined
      }
      list_views: {
        Args: Record<PropertyKey, never>
        Returns: {
          schema_name: string
          view_name: string
        }[]
      }
    }
    Enums: {
      action_category:
        | "lab_work"
        | "imaging"
        | "assessment"
        | "review"
        | "procedure"
        | "consultation"
        | "medication"
        | "other"
      form_question_type:
        | "text"
        | "multiple-choice"
        | "checkbox"
        | "dropdown"
        | "scale"
        | "date"
        | "file_upload"
      user_role_enum:
        | "patient"
        | "provider"
        | "research-partner"
        | "admin"
        | "developer"
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
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
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
    Enums: {
      action_category: [
        "lab_work",
        "imaging",
        "assessment",
        "review",
        "procedure",
        "consultation",
        "medication",
        "other",
      ],
      form_question_type: [
        "text",
        "multiple-choice",
        "checkbox",
        "dropdown",
        "scale",
        "date",
        "file_upload",
      ],
      user_role_enum: [
        "patient",
        "provider",
        "research-partner",
        "admin",
        "developer",
      ],
    },
  },
  storage: {
    Enums: {},
  },
} as const

