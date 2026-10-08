"use server"

import { getUserDb } from '@/lib/db/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

// Use the database types directly
export type Treatment = Database['public']['Tables']['global_treatments']['Row'] & {
  name: string
  description: string | null
  emoji: string | null
  image_url: string | null
}
export type TreatmentInsert = Database['public']['Tables']['global_treatments']['Insert']
export type TreatmentUpdate = Database['public']['Tables']['global_treatments']['Update']

const variableDetailsInclude = {
  global_variables: { select: { name: true, description: true, emoji: true, image_url: true } },
} as const

type TreatmentWithVariable = Database['public']['Tables']['global_treatments']['Row'] & {
  global_variables: Pick<Treatment, 'name' | 'description' | 'emoji' | 'image_url'>
}

// Flatten the joined global_variables fields into the treatment
function toTreatment({ global_variables, ...treatment }: TreatmentWithVariable): Treatment {
  return {
    ...treatment,
    name: global_variables.name,
    description: global_variables.description,
    emoji: global_variables.emoji,
    image_url: global_variables.image_url
  }
}

// Get all treatments
export async function getTreatmentsAction(): Promise<Treatment[]> {
  const db = await getUserDb()

  const treatments = await db.global_treatments.findMany({
    include: variableDetailsInclude,
    orderBy: { global_variables: { name: 'asc' } },
    take: 50,
  })

  return treatments.map(toTreatment)
}

// Get a treatment by ID
export async function getTreatmentByIdAction(id: string): Promise<Treatment | null> {
  const db = await getUserDb()

  const treatment = await db.global_treatments.findUnique({
    where: { id },
    include: variableDetailsInclude,
  })

  return treatment ? toTreatment(treatment) : null
}

// Search treatments by name
export async function searchTreatmentsAction(query: string): Promise<Treatment[]> {
  const db = await getUserDb()

  const treatments = await db.global_treatments.findMany({
    where: { global_variables: { is: { name: { contains: query, mode: 'insensitive' } } } },
    include: variableDetailsInclude,
    take: 10,
  })

  return treatments.map(toTreatment)
}

// Search treatments whose name or a synonym starts with the query (all treatments when it is blank)
export async function searchTreatmentOptionsAction(query: string): Promise<{ id: string; name: string }[]> {
  const db = await getUserDb()

  let treatmentIds: string[] | undefined
  if (query.trim()) {
    const synonyms = await db.global_variable_synonyms.findMany({
      where: { name: { startsWith: query, mode: 'insensitive' } },
      select: { global_variable_id: true },
      take: 50,
    })

    treatmentIds = [...new Set(synonyms.map((s) => s.global_variable_id))]
    if (treatmentIds.length === 0) {
      return []
    }
  }

  const treatments = await db.global_treatments.findMany({
    where: { deleted_at: null, ...(treatmentIds && { id: { in: treatmentIds } }) },
    select: { id: true, global_variables: { select: { name: true } } },
    take: 10,
  })

  return treatments.map((t) => ({
    id: t.id,
    name: t.global_variables.name || "Unknown Treatment Name",
  }))
}

// Get treatments for a specific condition
export async function getTreatmentsForConditionAction(conditionId: string): Promise<Treatment[]> {
  const db = await getUserDb();
  logger.info('Fetching treatments associated with condition via ratings', { conditionId });

  // Unique, not deleted treatments that patients rated for this condition
  const treatments = await db.global_treatments.findMany({
    where: {
      deleted_at: null,
      patient_treatments: {
        some: { treatment_ratings: { some: { patient_conditions: { is: { condition_id: conditionId } } } } },
      },
    },
    include: variableDetailsInclude,
  });

  const uniqueTreatments = treatments.map(toTreatment);
  logger.info(`Found ${uniqueTreatments.length} unique treatments for condition`, { conditionId });

  return uniqueTreatments;
}

// Create a new treatment
export async function createTreatmentAction(treatment: TreatmentInsert): Promise<Treatment> {
  const db = await getUserDb()

  const newTreatment = await db.global_treatments.create({
    data: treatment,
    include: variableDetailsInclude,
  })

  revalidatePath('/treatments')

  return toTreatment(newTreatment)
}

// Update a treatment
export async function updateTreatmentAction(id: string, updates: TreatmentUpdate): Promise<Treatment> {
  const db = await getUserDb()

  const updatedTreatment = await db.global_treatments.update({
    where: { id },
    data: { ...updates, updated_at: new Date() },
    include: variableDetailsInclude,
  })

  revalidatePath(`/treatment/${id}`)
  revalidatePath('/treatments')

  return toTreatment(updatedTreatment)
}

// Delete a treatment
export async function deleteTreatmentAction(id: string): Promise<void> {
  const db = await getUserDb()

  await db.global_treatments.deleteMany({ where: { id } })

  revalidatePath('/treatments')
}
