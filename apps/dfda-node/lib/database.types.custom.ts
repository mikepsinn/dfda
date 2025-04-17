import type { Database } from './database.types';

type PatientConditionInsert = Database['public']['Tables']['patient_conditions']['Insert'];
type PatientTreatmentInsert = Database['public']['Tables']['patient_treatments']['Insert'];

/**
 * Type for data required when creating a patient condition via server action.
 * Excludes fields automatically handled by the database (id, timestamps, user_variable_id trigger).
 */
export type PatientConditionClientInsert = Omit<PatientConditionInsert, 'user_variable_id' | 'id' | 'created_at' | 'updated_at'>;

/**
 * Type for data required when creating a patient treatment tracking entry via server action.
 * Excludes fields automatically handled by the database (id, timestamps, user_variable_id trigger).
 */
export type PatientTreatmentClientInsert = Omit<PatientTreatmentInsert, 'user_variable_id' | 'id' | 'created_at' | 'updated_at'>;

// Add other custom types or extensions here as needed in the future.