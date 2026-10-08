"use server"

import { getUserDb } from '@/lib/db/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

export type ReportedSideEffect = Database['public']['Tables']['patient_side_effects']['Row']
export type ReportedSideEffectInsert = Database['public']['Tables']['patient_side_effects']['Insert']
export type ReportedSideEffectUpdate = Database['public']['Tables']['patient_side_effects']['Update']

// Get individual side effect reports for a specific patient_treatment record
export async function getSideEffectReportsForPatientTreatmentAction(
  patientTreatmentId: string,
  limit = 10
): Promise<ReportedSideEffect[]> {
  const db = await getUserDb()
  logger.info('Fetching side effect reports for patient treatment', { patientTreatmentId });

  return db.patient_side_effects.findMany({
    where: { patient_treatment_id: patientTreatmentId, deleted_at: null },
    orderBy: { created_at: 'desc' },
    take: limit,
  })
}

// Report a side effect for a specific patient_treatment record
export async function reportSideEffectAction(
  sideEffect: Omit<ReportedSideEffectInsert, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> // Action receives data needed for insert
): Promise<ReportedSideEffect> {
  const db = await getUserDb()
  logger.info('Reporting side effect', { patientTreatmentId: sideEffect.patient_treatment_id });

  // Ensure required fields are present
  if (!sideEffect.patient_treatment_id || !sideEffect.description) {
      const errorMsg = 'Patient treatment ID and description are required to report a side effect.';
      logger.error(errorMsg, { sideEffect });
      throw new Error(errorMsg);
  }

  const report = await db.patient_side_effects.create({
    data: {
        patient_treatment_id: sideEffect.patient_treatment_id,
        description: sideEffect.description,
        severity_out_of_ten: sideEffect.severity_out_of_ten ?? null // Handle potential null severity
    },
  })

  // Revalidate based on patient_treatment_id (find the related treatment/patient paths)
  // This requires fetching the patient_treatment record to get treatment_id/patient_id
  // For simplicity now, revalidate the general treatments page
  // TODO: Implement more specific revalidation
  try {
    const pt = await db.patient_treatments.findUnique({
      where: { id: sideEffect.patient_treatment_id },
      select: { patient_id: true, treatment_id: true },
    });

    if (pt) {
      revalidatePath(`/patient/treatments`); // General page
      // revalidatePath(`/treatment/${pt.treatment_id}`); // If such a page exists
      // revalidatePath(`/patient/${pt.patient_id}/details`); // If such a page exists
    }
  } catch (revalError) {
      logger.warn('Failed to get patient_treatment details for revalidation', { patientTreatmentId: sideEffect.patient_treatment_id, revalError });
      revalidatePath(`/patient/treatments`); // Fallback revalidation
  }

  return report
}

// Update a side effect report (Payload should include patient_treatment_id if it can be changed? Unlikely)
export async function updateSideEffectReportAction(
  id: string,
  updates: Omit<ReportedSideEffectUpdate, 'patient_treatment_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<ReportedSideEffect> {
  const db = await getUserDb()
  logger.info('Updating side effect report', { reportId: id });

  const report = await db.patient_side_effects.update({
    where: { id },
    data: { ...updates, updated_at: new Date() },
  })

  // Revalidation needs the patient_treatment_id
  if (report.patient_treatment_id) {
     // TODO: Implement more specific revalidation similar to create action
     revalidatePath(`/patient/treatments`);
  }

  return report
}

// Delete a side effect report
export async function deleteSideEffectReportAction(id: string): Promise<void> {
  const db = await getUserDb()
  logger.warn('Deleting side effect report', { reportId: id });

  // Get the report before deleting to revalidate
  const report = await getSideEffectReportByIdAction(id)

  await db.patient_side_effects.deleteMany({ where: { id } })

  // Revalidation needs the patient_treatment_id
  if (report?.patient_treatment_id) {
    // TODO: Implement more specific revalidation similar to create action
    revalidatePath(`/patient/treatments`);
  }
}

// Get a side effect report by ID (remains the same)
export async function getSideEffectReportByIdAction(id: string): Promise<ReportedSideEffect | null> {
  const db = await getUserDb()
  logger.info('Fetching side effect report by ID', { reportId: id });

  // null when not found
  return db.patient_side_effects.findUnique({ where: { id } })
}
