import { supabase } from "@/lib/supabase"

export type UserHealthContext = {
  goals: string[]
  conditions: { name: string; severity?: number; notes?: string }[]
  recentSymptoms: { name: string; severity: number; date: string }[]
  recentMedications: { name: string; taken: boolean; date: string }[]
  recentMeals: { description: string; type: string; date: string }[]
}

/**
 * Fetches the user's health context data to provide to the AI
 */
export async function getUserHealthContext(userId: string): Promise<UserHealthContext | null> {
  if (!userId) return null

  try {
    // Fetch user goals
    const { data: userGoals, error: goalsError } = await supabase
      .from("user_goals")
      .select(`
        goals (
          name
        ),
        priority
      `)
      .eq("user_id", userId)
      .order("priority")

    if (goalsError) {
      console.error("Error fetching user goals:", goalsError)
    }

    // Fetch user conditions with severity and notes
    const { data: userConditions, error: conditionsError } = await supabase
      .from("user_conditions")
      .select(`
        conditions (
          name
        ),
        severity,
        notes
      `)
      .eq("user_id", userId)

    if (conditionsError) {
      console.error("Error fetching user conditions:", conditionsError)
    }

    // Fetch recent symptom logs (last 7 days)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { data: recentSymptoms, error: symptomsError } = await supabase
      .from("symptom_logs")
      .select(`
        symptoms (
          name
        ),
        severity,
        health_logs (
          date
        )
      `)
      .eq("health_logs.user_id", userId)
      .gte("health_logs.date", oneWeekAgo.toISOString().split("T")[0])
      .order("health_logs.date", { ascending: false })
      .limit(10)

    if (symptomsError) {
      console.error("Error fetching recent symptoms:", symptomsError)
    }

    // Fetch recent medication logs
    const { data: recentMedications, error: medicationsError } = await supabase
      .from("medication_logs")
      .select(`
        user_medications (
          medications (
            name
          )
        ),
        taken,
        health_logs (
          date
        )
      `)
      .eq("health_logs.user_id", userId)
      .gte("health_logs.date", oneWeekAgo.toISOString().split("T")[0])
      .order("health_logs.date", { ascending: false })
      .limit(10)

    if (medicationsError) {
      console.error("Error fetching recent medications:", medicationsError)
    }

    // Fetch recent meals
    const { data: recentMeals, error: mealsError } = await supabase
      .from("meals")
      .select(`
        description,
        meal_types (
          name
        ),
        health_logs (
          date
        )
      `)
      .eq("health_logs.user_id", userId)
      .gte("health_logs.date", oneWeekAgo.toISOString().split("T")[0])
      .order("health_logs.date", { ascending: false })
      .limit(10)

    if (mealsError) {
      console.error("Error fetching recent meals:", mealsError)
    }

    // Format the data for the AI context
    return {
      goals: userGoals?.map((g) => g.goals.name) || [],
      conditions:
        userConditions?.map((c) => ({
          name: c.conditions.name,
          severity: c.severity,
          notes: c.notes,
        })) || [],
      recentSymptoms:
        recentSymptoms?.map((s) => ({
          name: s.symptoms.name,
          severity: s.severity,
          date: s.health_logs.date,
        })) || [],
      recentMedications:
        recentMedications?.map((m) => ({
          name: m.user_medications.medications.name,
          taken: m.taken,
          date: m.health_logs.date,
        })) || [],
      recentMeals:
        recentMeals?.map((m) => ({
          description: m.description,
          type: m.meal_types.name,
          date: m.health_logs.date,
        })) || [],
    }
  } catch (error) {
    console.error("Error fetching user health context:", error)
    return null
  }
}
