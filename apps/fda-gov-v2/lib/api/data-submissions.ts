import { createServerSupabaseClient } from "../supabase"
import type { Database } from "../database.types"

export type DataSubmission = Database["public"]["Tables"]["data_submissions"]["Row"]
export type DataSubmissionInsert = Database["public"]["Tables"]["data_submissions"]["Insert"]
export type DataSubmissionUpdate = Database["public"]["Tables"]["data_submissions"]["Update"]

export async function getDataSubmissionsByEnrollment(enrollmentId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("data_submissions")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .order("submission_date", { ascending: false })

  if (error) {
    console.error(`Error fetching data submissions for enrollment ${enrollmentId}:`, error)
    throw error
  }

  return data
}

export async function createDataSubmission(submission: DataSubmissionInsert) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("data_submissions").insert(submission).select().single()

  if (error) {
    console.error("Error creating data submission:", error)
    throw error
  }

  return data
}

export async function updateDataSubmission(id: string, updates: DataSubmissionUpdate) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("data_submissions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error updating data submission with id ${id}:`, error)
    throw error
  }

  return data
}

export async function deleteDataSubmission(id: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from("data_submissions").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting data submission with id ${id}:`, error)
    throw error
  }

  return true
}

