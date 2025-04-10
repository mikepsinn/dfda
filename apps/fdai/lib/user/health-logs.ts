import { supabase } from "@/lib/supabase"

export type HealthLog = {
  id: string
  user_id: string
  date: string
  symptoms?: any[]
  meals?: any[]
  medications?: any[]
  notes?: string
}

// Function to save a health log
export async function saveHealthLog(
  userId: string,
  logData: Omit<HealthLog, "id" | "user_id">,
): Promise<HealthLog | null> {
  if (!userId) return null

  // For authenticated users, use Supabase
  const { data, error } = await supabase
    .from("health_logs")
    .insert([{ user_id: userId, ...logData }])
    .select()
    .single()

  if (error) {
    console.error("Error saving health log:", error)
    return null
  }

  return data
}

// Function to get health logs
export async function getHealthLogs(userId: string): Promise<HealthLog[]> {
  if (!userId) return []

  // For authenticated users, use Supabase
  const { data, error } = await supabase
    .from("health_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })

  if (error) {
    console.error("Error fetching health logs:", error)
    return []
  }

  return data || []
}
