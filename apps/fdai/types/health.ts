// Health-related type definitions

/**
 * Health log entry
 */
export interface HealthLog {
  id: string
  user_id: string
  date: string
  notes?: string
  overall_wellbeing?: number
  created_at?: string
  updated_at?: string
}

/**
 * Symptom definition
 */
export interface Symptom {
  id: string
  name: string
  category?: string
  description?: string
  emoji?: string
  image_url?: string
  created_at?: string
}

/**
 * Symptom log entry
 */
export interface SymptomLog {
  id: string
  health_log_id: string
  symptom_id: string
  severity: number
  time_of_day?: string
  notes?: string
  created_at?: string
  symptom?: Symptom
}

/**
 * Food definition
 */
export interface Food {
  id: string
  name: string
  category?: string
  calories_per_serving?: number
  protein_grams?: number
  carbs_grams?: number
  fat_grams?: number
  emoji?: string
  image_url?: string
  created_at?: string
}

/**
 * Meal type definition
 */
export interface MealType {
  id: string
  name: string
  created_at?: string
}

/**
 * Meal log entry
 */
export interface Meal {
  id: string
  health_log_id: string
  meal_type_id?: string
  description: string
  time_consumed?: string
  created_at?: string
  meal_type?: MealType
  foods?: MealFood[]
}

/**
 * Food in a meal
 */
export interface MealFood {
  id: string
  meal_id: string
  food_id: string
  quantity: number
  unit?: string
  created_at?: string
  food?: Food
}

/**
 * Medication definition
 */
export interface Medication {
  id: string
  name: string
  generic_name?: string
  description?: string
  typical_dosage?: string
  medication_type?: string
  emoji?: string
  image_url?: string
  created_at?: string
}

/**
 * User medication
 */
export interface UserMedication {
  id: string
  user_id: string
  medication_id: string
  dosage?: string
  frequency?: string
  start_date?: string
  end_date?: string
  notes?: string
  created_at?: string
  updated_at?: string
  medication?: Medication
}

/**
 * Medication log entry
 */
export interface MedicationLog {
  id: string
  health_log_id: string
  user_medication_id: string
  taken: boolean
  taken_at?: string
  dosage_taken?: string
  notes?: string
  created_at?: string
  user_medication?: UserMedication
}

/**
 * Treatment type definition
 */
export interface TreatmentType {
  id: string
  name: string
  description?: string
  created_at?: string
}

/**
 * Treatment definition
 */
export interface Treatment {
  id: string
  name: string
  treatment_type_id?: string
  description?: string
  typical_dosage?: string
  frequency?: string
  duration?: string
  emoji?: string
  image_url?: string
  created_at?: string
  treatment_type?: TreatmentType
}

/**
 * User treatment
 */
export interface UserTreatment {
  id: string
  user_id: string
  treatment_id: string
  dosage?: string
  frequency?: string
  start_date?: string
  end_date?: string
  notes?: string
  created_at?: string
  updated_at?: string
  treatment?: Treatment
}

/**
 * Treatment effectiveness rating
 */
export interface TreatmentEffectivenessRating {
  id: string
  user_id: string
  treatment_id: string
  condition_id?: string
  symptom_id?: string
  effectiveness_rating: number
  date: string
  notes?: string
  created_at?: string
}

/**
 * Treatment side effect
 */
export interface TreatmentSideEffect {
  id: string
  name: string
  description?: string
  category?: string
  emoji?: string
  image_url?: string
  created_at?: string
}

/**
 * Treatment side effect rating
 */
export interface TreatmentSideEffectRating {
  id: string
  user_id: string
  treatment_id: string
  side_effect_id: string
  severity_rating: number
  date: string
  notes?: string
  created_at?: string
}

/**
 * User health context for AI
 */
export interface UserHealthContext {
  goals: string[]
  conditions: { name: string; severity?: number; notes?: string }[]
  recentSymptoms: { name: string; severity: number; date: string }[]
  recentMedications: { name: string; taken: boolean; date: string }[]
  recentMeals: { description: string; type: string; date: string }[]
}
