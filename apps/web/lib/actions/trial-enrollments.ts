"use server"

import { logger } from "@/lib/logger"
import { Database } from "@/lib/database.types"
import type { Prisma } from "@/lib/db"
import { getUserDb } from "@/lib/db/server"
import type { Trial } from "@/lib/actions/trials"

export type TrialEnrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"]
export type TrialEnrollmentInsert = Database["public"]["Tables"]["trial_enrollments"]["Insert"]
export type TrialEnrollmentUpdate = Database["public"]["Tables"]["trial_enrollments"]["Update"]

// Extended type for enrollments with relations
export type EnrollmentWithRelations = TrialEnrollment & {
  patient: {
    id: string;
    profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  } & Database["public"]["Tables"]["patients"]["Row"];
  trial: Trial;
  trial_actions: (Database["public"]["Tables"]["trial_actions"]["Row"] & {
    action_type: Database["public"]["Tables"]["action_types"]["Row"]
  })[];
}

// Compensation is returned as a number rather than a Prisma.Decimal, so trials can be passed to client components
function toTrial<T extends { compensation: Prisma.Decimal | null }>(row: T): Omit<T, "compensation"> & { compensation: number | null } {
  return { ...row, compensation: row.compensation?.toNumber() ?? null }
}

const enrollmentTrialInclude = {
  trials: {
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      global_treatments: { select: { id: true, global_variables: { select: { name: true } } } },
      global_conditions: { select: { id: true, global_variables: { select: { name: true } } } },
    },
  },
} satisfies Prisma.trial_enrollmentsInclude

export async function getTrialEnrollmentsAction(): Promise<TrialEnrollment[]> {
  try {
    const db = await getUserDb()
    return await db.trial_enrollments.findMany({
      include: enrollmentTrialInclude,
      orderBy: { enrollment_date: "desc" },
    })
  } catch (error) {
    logger.error(`Error fetching trial enrollments:`, error)
    throw error
  }
}

export async function getTrialEnrollmentsByPatientAction(patientId: string): Promise<TrialEnrollment[]> {
  try {
    const db = await getUserDb()
    return await db.trial_enrollments.findMany({
      where: { patient_id: patientId },
      include: enrollmentTrialInclude,
      orderBy: { enrollment_date: "desc" },
    })
  } catch (error) {
    logger.error(`Error fetching trial enrollments for patient ${patientId}:`, error)
    throw error
  }
}

export async function getTrialEnrollmentsByTrialAction(trialId: string) {
  try {
    const db = await getUserDb()
    return await db.trial_enrollments.findMany({
      where: { trial_id: trialId },
      include: {
        patients: {
          select: { id: true, profiles: { select: { first_name: true, last_name: true, email: true } } },
        },
      },
      orderBy: { enrollment_date: "desc" },
    })
  } catch (error) {
    logger.error(`Error fetching trial enrollments for trial ${trialId}:`, error)
    throw error
  }
}

export async function createTrialEnrollmentAction(enrollment: TrialEnrollmentInsert) {
  try {
    const db = await getUserDb()
    return await db.trial_enrollments.create({ data: enrollment })
  } catch (error) {
    logger.error("Error creating trial enrollment:", error)
    throw error
  }
}

export async function updateTrialEnrollmentAction(id: string, updates: TrialEnrollmentUpdate) {
  try {
    const db = await getUserDb()
    return await db.trial_enrollments.update({
      where: { id },
      data: { ...updates, updated_at: new Date() },
    })
  } catch (error) {
    logger.error(`Error updating trial enrollment with id ${id}:`, error)
    throw error
  }
}

export async function deleteTrialEnrollmentAction(id: string) {
  try {
    const db = await getUserDb()
    await db.trial_enrollments.deleteMany({ where: { id } })
  } catch (error) {
    logger.error(`Error deleting trial enrollment with id ${id}:`, error)
    throw error
  }

  return true
}

export async function updateEnrollmentStatusAction(enrollmentId: string, status: TrialEnrollment['status']) {
  try {
    const db = await getUserDb()
    return await db.trial_enrollments.update({
      where: { id: enrollmentId },
      data: { status, updated_at: new Date() },
    })
  } catch (error) {
    logger.error(`Error updating enrollment status for ${enrollmentId}:`, error)
    throw error
  }
}

export async function getTrialEnrollmentByIdAction(id: string): Promise<TrialEnrollment | null> {
  try {
    const db = await getUserDb()
    return await db.trial_enrollments.findUnique({ where: { id } })
  } catch (error) {
    logger.error(`Error fetching trial enrollment with id ${id}:`, error)
    throw error
  }
}

export async function getTrialEnrollmentByTrialAndPatientAction(trialId: string, patientId: string): Promise<TrialEnrollment | null> {
  try {
    const db = await getUserDb()
    return await db.trial_enrollments.findFirst({
      where: { trial_id: trialId, patient_id: patientId },
    })
  } catch (error) {
    logger.error(`Error fetching trial enrollment for trial ${trialId} and patient ${patientId}:`, error)
    throw error
  }
}

// Get enrollment status for a patient in a trial
export async function getTrialEnrollmentStatusAction(trialId: string, patientId: string) {
  try {
    const db = await getUserDb()
    return await db.trial_enrollments.findFirst({
      where: { trial_id: trialId, patient_id: patientId },
    })
  } catch (error) {
    logger.error("Error fetching trial enrollment status:", error)
    throw new Error("Failed to fetch enrollment status")
  }
}

// Get enrollments with related data for provider
export async function getProviderEnrollmentsAction(providerId: string): Promise<EnrollmentWithRelations[]> {
  try {
    const db = await getUserDb()
    const enrollments = await db.trial_enrollments.findMany({
      where: {
        provider_id: providerId,
        deleted_at: null,
        patients: { is: {} },
        trials: { is: {} },
        trial_actions: { some: {} },
      },
      include: {
        patients: { include: { profiles: true } },
        trials: true,
        trial_actions: { include: { action_types: true } },
      },
    })

    return enrollments.map(({ patients: { profiles, ...patient }, trials, trial_actions, ...enrollment }) => ({
      ...enrollment,
      // Row-level security hides patients' profiles from providers; Prisma then returns null
      patient: { ...patient, profile: profiles as typeof profiles | null },
      trial: toTrial(trials),
      trial_actions: trial_actions.map(({ action_types, ...action }) => ({ ...action, action_type: action_types })),
    }))
  } catch (error) {
    logger.error("Error fetching enrollments for provider:", error)
    throw new Error("Failed to fetch enrollments")
  }
}

// Get active enrollment with trial data for a patient
export async function getPatientActiveEnrollmentAction(patientId: string) {
  try {
    const db = await getUserDb()
    const enrollment = await db.trial_enrollments.findFirst({
      where: { patient_id: patientId, status: "approved", trials: { is: {} } },
      include: { trials: true },
    })

    if (!enrollment) {
      return null
    }

    const { trials, ...row } = enrollment
    return { ...row, trial: toTrial(trials) }
  } catch (error) {
    logger.error("Error fetching patient enrollment:", error)
    throw new Error("Failed to fetch patient enrollment")
  }
}

// Update enrollment after data submission
export async function updateEnrollmentAfterSubmissionAction(enrollmentId: string) {
  try {
    const db = await getUserDb()
    await db.trial_enrollments.updateMany({
      where: { id: enrollmentId },
      data: {
        updated_at: new Date(),
        notes: "Data submission completed"
      },
    })
  } catch (error) {
    logger.error("Error updating enrollment:", error)
    throw new Error("Failed to update enrollment")
  }
}

// Create initial enrollment request for a patient
export async function createInitialEnrollmentAction(trialId: string, patientId: string) {
  try {
    const db = await getUserDb()
    const now = new Date()
    return await db.trial_enrollments.create({
      data: {
        trial_id: trialId,
        patient_id: patientId,
        provider_id: "system", // TODO: Get actual provider ID
        status: "pending",
        enrollment_date: now,
        notes: "Initial enrollment request",
        created_at: now,
        updated_at: now
      },
    })
  } catch (error) {
    logger.error("Error creating initial enrollment:", error)
    throw new Error("Failed to create enrollment")
  }
}

// Add action functions here later if needed
