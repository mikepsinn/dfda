"use server"

import { getUserDb } from '@/lib/db/server'
import type { Prisma } from '@/lib/db'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

type TrialRow = Database["public"]["Tables"]["trials"]["Row"]

// Compensation is returned as a number rather than a Prisma.Decimal, so trials can be passed to client components
export type Trial = Omit<TrialRow, "compensation"> & { compensation: number | null }
export type TrialInsert = Database["public"]["Tables"]["trials"]["Insert"]
export type TrialUpdate = Database["public"]["Tables"]["trials"]["Update"]
export type Enrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"]

// Type for trials with joined relations. Condition and treatment names come from global_variables,
// the research partner name from the sponsor's profile.
export type TrialWithRelations = Trial & {
  global_conditions: { id: string; name: string; icd_code: string | null }
  global_treatments: { id: string; name: string; treatment_type: string; manufacturer: string | null }
  research_partners: { id: string; name: string } | null
}

// Types for provider dashboard
type FetchedTrial = Trial & {
  trial_enrollments: Database["public"]["Tables"]["trial_enrollments"]["Row"][];
  trial_actions: (Database["public"]["Tables"]["trial_actions"]["Row"] & {
    action_type: Database["public"]["Tables"]["action_types"]["Row"]
  })[];
  research_partner_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
}

type FetchedPatient = Database["public"]["Tables"]["patients"]["Row"] & {
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  conditions: {
    condition: {
      id: string;
      global_variables: {
        name: string;
      }
    } | null
  }[];
}

function toTrial<T extends { compensation: Prisma.Decimal | null }>(row: T): Omit<T, "compensation"> & { compensation: number | null } {
  return { ...row, compensation: row.compensation?.toNumber() ?? null }
}

// Row-level security hides some profiles from the reader. Prisma then returns null for the
// relation although the schema requires it, so profiles are treated as nullable here.
function partnerName(profile: { first_name: string | null; last_name: string | null } | null): string {
  return profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : ""
}

const trialRelationsInclude = {
  global_conditions: { select: { id: true, icd_code: true, global_variables: { select: { name: true } } } },
  global_treatments: {
    select: { id: true, treatment_type: true, manufacturer: true, global_variables: { select: { name: true } } },
  },
  profiles: { select: { id: true, first_name: true, last_name: true } },
} satisfies Prisma.trialsInclude

function toTrialWithRelations({
  global_conditions,
  global_treatments,
  profiles,
  ...trial
}: Prisma.trialsGetPayload<{ include: typeof trialRelationsInclude }>): TrialWithRelations {
  return {
    ...toTrial(trial),
    global_conditions: {
      id: global_conditions.id,
      name: global_conditions.global_variables.name,
      icd_code: global_conditions.icd_code,
    },
    global_treatments: {
      id: global_treatments.id,
      name: global_treatments.global_variables.name,
      treatment_type: global_treatments.treatment_type,
      manufacturer: global_treatments.manufacturer,
    },
    research_partners: profiles ? { id: profiles.id, name: partnerName(profiles) } : null,
  }
}

// Find trials matching the given condition IDs
export async function findTrialsForConditionsAction(
  conditionIds: string[]
): Promise<TrialWithRelations[]> {
  if (!conditionIds.length) {
    return []
  }

  try {
    const db = await getUserDb()
    const trials = await db.trials.findMany({
      where: { condition_id: { in: conditionIds }, status: "active" },
      include: trialRelationsInclude,
      orderBy: { created_at: "desc" },
    })
    return trials.map(toTrialWithRelations)
  } catch (error) {
    logger.error("Error finding trials:", error)
    throw new Error("Failed to find trials")
  }
}

// Get a trial by ID
export async function getTrialByIdAction(id: string): Promise<TrialWithRelations | null> {
  try {
    const db = await getUserDb()
    const trial = await db.trials.findUnique({
      where: { id },
      include: trialRelationsInclude,
    })
    return trial ? toTrialWithRelations(trial) : null
  } catch (error) {
    logger.error("Error fetching trial:", error)
    throw new Error("Failed to fetch trial")
  }
}

// Get all trials
export async function getTrialsAction(): Promise<TrialWithRelations[]> {
  try {
    const db = await getUserDb()
    const trials = await db.trials.findMany({
      include: trialRelationsInclude,
      orderBy: { created_at: "desc" },
    })
    return trials.map(toTrialWithRelations)
  } catch (error) {
    logger.error("Error fetching trials:", error)
    throw new Error("Failed to fetch trials")
  }
}

// Get trials by condition
export async function getTrialsByConditionAction(conditionId: string) {
  try {
    const db = await getUserDb()
    const trials = await db.trials.findMany({
      where: {
        condition_id: conditionId,
        // Recruiting trials are the ones patients can join and the only joinable status
        // that public visitors may read (see the trials row-level security policy).
        status: "recruiting",
      },
      include: { profiles: { select: { first_name: true, last_name: true } } },
    })

    return trials.map(({ profiles, ...trial }) => ({
      ...toTrial(trial),
      research_partner: profiles as typeof profiles | null,
      research_partner_name: partnerName(profiles) || 'Unknown Sponsor',
    }))
  } catch (error) {
    logger.error("Error fetching trials by condition:", { error, conditionId })
    throw new Error("Failed to fetch trials")
  }
}

// Get trials by treatment
export async function getTrialsByTreatmentAction(treatmentId: string): Promise<TrialWithRelations[]> {
  try {
    const db = await getUserDb()
    const trials = await db.trials.findMany({
      where: { treatment_id: treatmentId, status: "active" },
      include: trialRelationsInclude,
      orderBy: { created_at: "desc" },
    })
    return trials.map(toTrialWithRelations)
  } catch (error) {
    logger.error(`Error fetching trials for treatment ${treatmentId}:`, error)
    throw new Error("Failed to fetch trials for treatment")
  }
}

// Create a new trial
export async function createTrialAction(trial: TrialInsert): Promise<Trial> {
  let created
  try {
    const db = await getUserDb()
    created = await db.trials.create({ data: trial })
  } catch (error) {
    logger.error("Error creating trial:", error)
    throw new Error("Failed to create trial")
  }

  revalidatePath("/trials")
  revalidatePath("/admin/trials")
  revalidatePath("/research-partner/")
  return toTrial(created)
}

// Update a trial
export async function updateTrialAction(id: string, updates: TrialUpdate): Promise<Trial> {
  let updated
  try {
    const db = await getUserDb()
    updated = await db.trials.update({
      where: { id },
      data: { ...updates, updated_at: new Date() },
    })
  } catch (error) {
    logger.error(`Error updating trial with id ${id}:`, error)
    throw new Error("Failed to update trial")
  }

  revalidatePath(`/trials/${id}`)
  revalidatePath("/trials")
  revalidatePath("/admin/trials")
  revalidatePath("/research-partner/")
  return toTrial(updated)
}

// Delete a trial
export async function deleteTrialAction(id: string): Promise<void> {
  try {
    const db = await getUserDb()
    await db.trials.deleteMany({ where: { id } })
  } catch (error) {
    logger.error(`Error deleting trial with id ${id}:`, error)
    throw new Error("Failed to delete trial")
  }

  revalidatePath("/trials")
  revalidatePath("/admin/trials")
  revalidatePath("/research-partner/")
}

// Get all trials for a research partner grouped by status
export async function getResearchPartnerTrialsAction(researchPartnerId: string): Promise<{
  activeTrials: TrialWithRelations[];
  completedTrials: TrialWithRelations[];
  pendingTrials: TrialWithRelations[];
}> {
  const db = await getUserDb()

  const trialsWithStatus = async (status: "active" | "completed" | "pending") => {
    try {
      const trials = await db.trials.findMany({
        where: { research_partner_id: researchPartnerId, status },
        include: trialRelationsInclude,
      })
      return trials.map(toTrialWithRelations)
    } catch (error) {
      logger.error(`Error fetching ${status} trials:`, error)
      throw new Error(`Failed to fetch ${status} trials`)
    }
  }

  const [activeTrials, completedTrials, pendingTrials] = await Promise.all([
    trialsWithStatus("active"),
    trialsWithStatus("completed"),
    trialsWithStatus("pending"),
  ])

  return { activeTrials, completedTrials, pendingTrials }
}

export type TrialDetails = Trial & {
  condition_name: string | null
  treatment_name: string | null
  research_partner_name: string | null
}

// Get one trial with the names of its condition, treatment and sponsor.
// Returns null when no trial has this id or the visitor may not read it.
export async function getTrialDetailsAction(trialId: string): Promise<TrialDetails | null> {
  // Trial ids are UUIDs; the database rejects other values with an error, not an empty result.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trialId)) {
    return null
  }

  try {
    const db = await getUserDb()
    const trial = await db.trials.findUnique({
      where: { id: trialId },
      include: {
        global_conditions: { select: { global_variables: { select: { name: true } } } },
        global_treatments: { select: { global_variables: { select: { name: true } } } },
        profiles: { select: { first_name: true, last_name: true } },
      },
    })

    if (!trial) {
      return null
    }

    const { global_conditions, global_treatments, profiles, ...row } = trial

    return {
      ...toTrial(row),
      condition_name: global_conditions.global_variables.name,
      treatment_name: global_treatments.global_variables.name,
      research_partner_name: partnerName(profiles) || null,
    }
  } catch (error) {
    logger.error("Error fetching trial details:", { trialId, error })
    throw new Error("Failed to fetch trial details")
  }
}

// Get active trials with enrollments and actions for provider dashboard
export async function getProviderActiveTrialsAction(): Promise<FetchedTrial[]> {
  try {
    const db = await getUserDb()
    const trials = await db.trials.findMany({
      where: {
        status: "active",
        deleted_at: null,
        trial_enrollments: { some: {} },
        trial_actions: { some: {} },
      },
      include: {
        trial_enrollments: true,
        trial_actions: { include: { action_types: true } },
        profiles: true,
      },
    })

    return trials.map(({ trial_actions, profiles, ...trial }) => ({
      ...toTrial(trial),
      trial_actions: trial_actions.map(({ action_types, ...action }) => ({ ...action, action_type: action_types })),
      research_partner_profile: profiles as typeof profiles | null,
    }))
  } catch (error) {
    logger.error("Error fetching active trials for provider:", error)
    throw new Error("Failed to fetch active trials")
  }
}

// Get eligible patients with conditions for provider dashboard
export async function getProviderPatientsAction(): Promise<FetchedPatient[]> {
  try {
    const db = await getUserDb()
    const patients = await db.patients.findMany({
      where: { deleted_at: null, patient_conditions: { some: {} } },
      include: {
        profiles: true,
        patient_conditions: {
          select: {
            global_conditions: { select: { id: true, global_variables: { select: { name: true } } } },
          },
        },
      },
    })

    return patients.map(({ profiles, patient_conditions, ...patient }) => ({
      ...patient,
      profile: profiles as typeof profiles | null,
      conditions: patient_conditions.map(({ global_conditions }) => ({ condition: global_conditions })),
    }))
  } catch (error) {
    logger.error("Error fetching patients for provider:", error)
    throw new Error("Failed to fetch patients")
  }
}
