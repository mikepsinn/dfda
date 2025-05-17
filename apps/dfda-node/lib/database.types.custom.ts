import type { Database } from './database.types';

// Define VariableCategoryId here to avoid circular dependencies
export type VariableCategoryId = Database["public"]["Tables"]["variable_categories"]["Row"]["id"];

// Define ReminderNotificationStatus here
export type ReminderNotificationStatus = Database["public"]["Enums"]["reminder_notification_status"];

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

// RENAMED from FetchedPendingNotification
export type ReminderNotificationDetails = {
  notificationId: string; // Corresponds to reminder_notifications.id
  scheduleId: string;     // Corresponds to reminder_schedules.id
  userVariableId: string;
  variableName: string; // Assuming actions will provide a fallback if null from DB
  globalVariableId: string;
  variableCategory: VariableCategoryId; // Use the locally defined VariableCategoryId
  unitId: string;
  unitName: string; // Assuming actions will provide a fallback if null from DB
  dueAt: string;          // Corresponds to reminder_notifications.notification_trigger_at
  title: string | null;
  message: string | null;
  status: ReminderNotificationStatus; // Uses the local definition now
  defaultValue?: number | null; // Card will handle string input separately
  emoji?: string | null;
  isEditable?: boolean | null;
  value?: number | null;       // Represents the logged value if status is 'completed'
};

// Add other custom types or extensions here as needed in the future.