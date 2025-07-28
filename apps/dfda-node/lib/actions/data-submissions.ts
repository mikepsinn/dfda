"use server"

import { createClient } from '@/utils/supabase/server'
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

// Get latest data submission for an enrollment
export async function getLatestDataSubmissionAction(enrollmentId: string) {
  const supabase = await createClient()
  
  const { data: submission, error } = await supabase
    .from("data_submissions")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // Ignore not found error
    logger.error("Error fetching data submission:", error)
    throw new Error("Failed to fetch data submission")
  }

  return submission
}

// Submit trial data
export async function submitTrialDataAction(submission: DataSubmissionInsert) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("data_submissions")
    .insert(submission)

  if (error) {
    logger.error("Error submitting trial data:", error)
    throw new Error("Failed to submit trial data")
  }
}

// Get metrics for a user's data submissions
export async function getDataSubmissionMetricsAction(enrollmentId: string) {
  try {
    const supabase = await createClient()
    const { data: submissions, error } = await supabase
      .from("data_submissions")
      .select("id, enrollment_id, submission_date, created_at")
      .eq("enrollment_id", enrollmentId)
      .order("created_at", { ascending: false })

    if (error) {
      logger.error("Error getting data submission metrics:", error)
      return {
        submissions: 0,
        completionRate: 0,
        nextSubmission: null
      }
    }

    // Calculate metrics
    const submissionCount = submissions?.length || 0
    
    // In a real app, completion rate would be calculated based on expected vs actual submissions
    // For now using a placeholder calculation
    const completionRate = submissionCount > 0 ? 85 : 0
    
    // Next submission is 3 days from now (placeholder logic)
    const nextSubmission = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

    return {
      submissions: submissionCount,
      completionRate,
      nextSubmission
    }
  } catch (error) {
    logger.error("Error calculating data submission metrics:", error)
    return {
      submissions: 0,
      completionRate: 0,
      nextSubmission: null
    }
  }
}

// Add action functions here later if needed 