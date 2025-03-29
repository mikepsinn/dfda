"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { logger } from "@/lib/logger"

export type DataSubmission = Database["public"]["Tables"]["data_submissions"]["Row"]
export type DataSubmissionInsert = Database["public"]["Tables"]["data_submissions"]["Insert"]
export type DataSubmissionUpdate = Database["public"]["Tables"]["data_submissions"]["Update"]

export async function getDataSubmissionsByEnrollmentAction(enrollmentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("data_submissions")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .order("submission_date", { ascending: false })

  if (error) {
    logger.error(`Error fetching data submissions for enrollment ${enrollmentId}:`, error)
    throw error
  }

  return data
}

export async function createDataSubmissionAction(data: DataSubmissionInsert): Promise<DataSubmission | null> {
  try {
    const supabase = await createClient()
    const { data: submission, error } = await supabase
      .from('data_submissions')
      .insert(data)
      .select()
      .single()

    if (error) {
      logger.error('Error creating data submission:', error)
      return null
    }

    return submission
  } catch (error) {
    logger.error('Error creating data submission:', error)
    return null
  }
}

export async function updateDataSubmissionAction(id: string, updates: DataSubmissionUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("data_submissions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    logger.error(`Error updating data submission with id ${id}:`, error)
    throw error
  }

  return data
}

export async function deleteDataSubmissionAction(id: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('data_submissions')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error(`Error deleting data submission with id ${id}:`, error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error deleting data submission:', error)
    return false
  }
}

export async function getDataSubmissionByIdAction(id: string): Promise<DataSubmission | null> {
  try {
    const supabase = await createClient()
    const { data: submission, error } = await supabase
      .from('data_submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logger.error(`Error fetching data submission with id ${id}:`, error)
      return null
    }

    return submission
  } catch (error) {
    logger.error('Error getting data submission:', error)
    return null
  }
}

export async function getDataSubmissionsAction(): Promise<DataSubmission[]> {
  try {
    const supabase = await createClient()
    const { data: submissions, error } = await supabase
      .from('data_submissions')
      .select('*')

    if (error) {
      logger.error('Error getting data submissions:', error)
      return []
    }

    return submissions
  } catch (error) {
    logger.error('Error getting data submissions:', error)
    return []
  }
} 