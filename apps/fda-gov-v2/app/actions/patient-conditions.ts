"use server"

import { createServerClient } from "@/lib/supabase"
import { getServerUser } from "@/lib/server-auth"
import type { Database } from "@/lib/database.types"
import { revalidatePath } from "next/cache"

// Use the database view type directly 
type ConditionView = Database["public"]["Views"]["patient_conditions_view"]["Row"]
type PatientConditionInsert = Database["public"]["Tables"]["patient_conditions"]["Insert"]
type PatientConditionUpdate = Database["public"]["Tables"]["patient_conditions"]["Update"]

// Get all conditions for the current patient
export async function getPatientConditionsAction(): Promise<ConditionView[]> {
  const supabase = createServerClient()
  const user = await getServerUser()
  
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("patient_conditions_view")
    .select("*")
    .eq("patient_id", user.id)

  if (error) {
    throw error
  }

  return data
}

// Add a condition to the patient's profile
export async function addPatientConditionAction(conditionData: PatientConditionInsert) {
  const supabase = createServerClient()
  const user = await getServerUser()
  
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("patient_conditions")
    .insert({ ...conditionData, patient_id: user.id })
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath("/patient/dashboard")
  return data
}

// Update a patient condition
export async function updatePatientConditionAction(id: string, updates: PatientConditionUpdate) {
  const supabase = createServerClient()
  const user = await getServerUser()
  
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("patient_conditions")
    .update(updates)
    .eq("id", id)
    .eq("patient_id", user.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  revalidatePath("/patient/dashboard")
  return data
}

// Delete a patient condition
export async function deletePatientConditionAction(id: string) {
  const supabase = createServerClient()
  const user = await getServerUser()
  
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { error } = await supabase
    .from("patient_conditions")
    .delete()
    .eq("id", id)
    .eq("patient_id", user.id)

  if (error) {
    throw error
  }

  revalidatePath("/patient/dashboard")
  return true
} 