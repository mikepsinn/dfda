"use server"

import { createServerClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"

export type DataSubmission = Database["public"]["Tables"]["data_submissions"]["Row"]
export type DataSubmissionInsert = Database["public"]["Tables"]["data_submissions"]["Insert"]
export type DataSubmissionUpdate = Database["public"]["Tables"]["data_submissions"]["Update"]

export async function getDataSubmissionsByEnrollmentAction(enrollmentId: string) {
  const supabase = createServerClient()
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

export async function createDataSubmissionAction(submission: DataSubmissionInsert) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("data_submissions").insert(submission).select().single()

  if (error) {
    logger.error("Error creating data submission:", error)
    throw error
  }

  return data
}

export async function updateDataSubmissionAction(id: string, updates: DataSubmissionUpdate) {
  const supabase = createServerClient()
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

export async function deleteDataSubmissionAction(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("data_submissions").delete().eq("id", id)

  if (error) {
    logger.error(`Error deleting data submission with id ${id}:`, error)
    throw error
  }

  return true
} 