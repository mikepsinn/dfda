"use server"

import { getUserDb } from '@/lib/db/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
// Remove VARIABLE_CATEGORIES import if no longer needed elsewhere
// import { VARIABLE_CATEGORIES } from '@/lib/constants/variable-categories'

// Use Tables helper for specific types
import { Tables } from '@/lib/database.types';

// Combined type for Condition including name/description from global_variables
type Condition = Pick<Tables<'global_conditions'>, 'id' | 'created_at' | 'deleted_at' | 'updated_at'> & 
                 Pick<Tables<'global_variables'>, 'name' | 'description'>;

// Use the database view type directly 
export type ConditionView = Database['public']['Views']['patient_conditions_view']['Row']
export type PatientConditionRow = ConditionView; // Alias for clarity in component
export type ConditionInsert = Database['public']['Tables']['global_conditions']['Insert']
export type ConditionUpdate = Database['public']['Tables']['global_conditions']['Update']

const conditionSummarySelect = {
  id: true,
  global_variables: { select: { name: true, description: true, emoji: true } },
} as const

type ConditionSummaryRow = {
  id: string
  global_variables: Pick<Tables<'global_variables'>, 'name' | 'description' | 'emoji'>
}

// Flatten the joined global_variables fields into the condition
function toConditionSummary(item: ConditionSummaryRow) {
  return {
    id: item.id,
    name: item.global_variables.name,
    description: item.global_variables.description,
    emoji: item.global_variables.emoji
  }
}

// Get all conditions present in the conditions table
export async function getConditionsAction() {
  const db = await getUserDb()

  const conditions = await db.global_conditions.findMany({
    select: conditionSummarySelect,
    orderBy: { id: 'asc' },
    take: 50,
  })

  return conditions.map(toConditionSummary);
}

// Get a condition by ID with joined name from global_variables
// This function already seems okay as it uses patient_conditions_view
// which likely already joins conditions and global_variables.
export async function getConditionByIdAction(id: string): Promise<ConditionView | null> {
  const db = await getUserDb()

  return db.patient_conditions_view.findFirst({ where: { id } })
}

// Get a public condition by its global variable id (the id used in condition URLs)
export async function getGlobalConditionByIdAction(id: string) {
  const db = await getUserDb();

  const condition = await db.global_conditions.findUnique({
    where: { id },
    select: conditionSummarySelect,
  });

  if (!condition) {
    logger.warn('Condition not found by id:', { id });
    return null;
  }

  return toConditionSummary(condition);
}

// Search conditions by name, ensuring they exist in the conditions table
export async function searchConditionsAction(query: string) {
  const db = await getUserDb()
  logger.info('Searching conditions with query:', { query })

  try {
    const conditions = await db.global_conditions.findMany({
      where: { global_variables: { is: { name: { contains: query, mode: 'insensitive' } } } },
      select: conditionSummarySelect,
      orderBy: { id: 'asc' },
    })

    const results = conditions.map(toConditionSummary);

    logger.info('Found conditions:', { count: results.length });
    return results;
  } catch (error) {
    logger.error('Error in searchConditionsAction:', { error })
    throw error
  }
}

// Create a new condition
export async function createConditionAction(condition: ConditionInsert) {
  const db = await getUserDb()

  const created = await db.global_conditions.create({ data: condition })

  revalidatePath('/conditions')
  return created
}

// Update a condition
export async function updateConditionAction(id: string, updates: ConditionUpdate) {
  const db = await getUserDb()

  const updated = await db.global_conditions.update({
    where: { id },
    data: { ...updates, updated_at: new Date() },
  })

  revalidatePath(`/condition/${id}`)
  revalidatePath('/conditions')
  return updated
}

// Delete a condition
export async function deleteConditionAction(id: string) {
  const db = await getUserDb()

  await db.global_conditions.deleteMany({ where: { id } })

  revalidatePath('/conditions')
}

// Gets conditions associated with a specific user from the view
// Returns data matching the PatientConditionRow type (aliased from ConditionView)
export async function getConditionsByUserAction(userId: string): Promise<PatientConditionRow[]> {
  const db = await getUserDb()
  logger.info("Fetching user conditions view for user", { userId })

  // Fetch patient conditions directly from the view
  return db.patient_conditions_view.findMany({
    where: { patient_id: userId },
    orderBy: { condition_name: 'asc' },
  });
}

/**
 * Gets conditions associated with a specific treatment.
 * This might involve looking at patient_treatments and patient_conditions
 * to see which conditions patients using this treatment also have.
 * 
 * Alternative: If treatments are directly linked to conditions they treat,
 * the query would be simpler.
 * 
 * Current Approach: Find patients using the treatment, then find their conditions.
 * 
 * @param treatmentId The ID of the treatment.
 * @returns A promise resolving to an array of Condition objects.
 */
export async function getConditionsForTreatmentAction(treatmentId: string): Promise<Condition[]> {
  const db = await getUserDb()
  logger.info("Fetching conditions associated with treatment", { treatmentId })

  // 1. Find patient_ids using the treatment
  const patientTreatments = await db.patient_treatments.findMany({
    where: { treatment_id: treatmentId },
    select: { patient_id: true },
  });

  const patientIds = patientTreatments.map(pt => pt.patient_id);

  if (patientIds.length === 0) {
    logger.info('No patients found for treatment, thus no associated conditions', { treatmentId });
    return [];
  }

  // 2. Find the unique (not deleted) conditions these patients have
  const conditions = await db.global_conditions.findMany({
    where: {
      deleted_at: null,
      patient_conditions: { some: { patient_id: { in: patientIds }, deleted_at: null } },
    },
    select: {
      id: true,
      created_at: true,
      deleted_at: true,
      updated_at: true,
      global_variables: { select: { name: true, description: true } },
    },
  });

  return conditions.map(({ global_variables, ...condition }) => ({
    ...condition,
    name: global_variables.name,
    description: global_variables.description
  }));
}
