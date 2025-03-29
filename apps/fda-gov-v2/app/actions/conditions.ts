"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { VARIABLE_CATEGORIES } from '@/lib/constants/variable-categories'

// Use the database view type directly 
export type ConditionView = Database['public']['Views']['patient_conditions_view']['Row']
export type ConditionInsert = Database['public']['Tables']['conditions']['Insert']
export type ConditionUpdate = Database['public']['Tables']['conditions']['Update']

// Get all conditions from global_variables
export async function getConditionsAction() {
  const supabase = await createClient()

  const response = await supabase
    .from('global_variables')
    .select('id, name, description, emoji')
    .eq('variable_category_id', VARIABLE_CATEGORIES.HEALTH_AND_PHYSIOLOGY)
    .order('name')
    .limit(50)

  if (response.error) {
    logger.error('Error fetching conditions:', { error: response.error })
    throw new Error('Failed to fetch conditions')
  }

  return response.data
}

// Get a condition by ID with joined name from global_variables
export async function getConditionByIdAction(id: string): Promise<ConditionView | null> {
  const supabase = await createClient()

  const response = await supabase
    .from('patient_conditions_view')
    .select()
    .eq('id', id)
    .single()

  if (response.error) {
    logger.error('Error fetching condition:', { error: response.error })
    throw new Error('Failed to fetch condition')
  }

  return response.data
}

// Search conditions by name in global_variables
export async function searchConditionsAction(query: string) {
  const supabase = await createClient()
  logger.info('Searching conditions with query:', { query, categoryId: VARIABLE_CATEGORIES.HEALTH_AND_PHYSIOLOGY })

  try {
    const { data: conditions, error } = await supabase
      .from('global_variables')
      .select('id, name, description, emoji')
      .eq('variable_category_id', VARIABLE_CATEGORIES.HEALTH_AND_PHYSIOLOGY)
      .ilike('name', `%${query}%`)
      .order('name')

    if (error) {
      logger.error('Error searching conditions:', { error })
      throw error
    }

    logger.info('Found conditions:', { count: conditions?.length })
    return conditions || []
  } catch (error) {
    logger.error('Error in searchConditionsAction:', { error })
    throw error
  }
}

// Create a new condition
export async function createConditionAction(condition: ConditionInsert) {
  const supabase = await createClient()

  const response = await supabase.from("conditions").insert(condition).select().single()

  if (response.error) {
    logger.error('Error creating condition:', { error: response.error })
    throw new Error('Failed to create condition')
  }

  revalidatePath('/conditions')
  return response.data
}

// Update a condition
export async function updateConditionAction(id: string, updates: ConditionUpdate) {
  const supabase = await createClient()

  const response = await supabase
    .from("conditions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (response.error) {
    logger.error('Error updating condition:', { error: response.error })
    throw new Error('Failed to update condition')
  }

  revalidatePath(`/condition/${id}`)
  revalidatePath('/conditions')
  return response.data
}

// Delete a condition
export async function deleteConditionAction(id: string) {
  const supabase = await createClient()

  const response = await supabase.from("conditions").delete().eq("id", id)

  if (response.error) {
    logger.error('Error deleting condition:', { error: response.error })
    throw new Error('Failed to delete condition')
  }

  revalidatePath('/conditions')
}
