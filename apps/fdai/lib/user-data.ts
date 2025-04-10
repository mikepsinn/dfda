import { supabase } from "./supabase"

// Type definitions for user data
export type UserProfile = {
  id: string
  email?: string
  name?: string
  created_at?: string
}

export type UserGoal = {
  id?: string
  user_id: string
  goal_id?: string
  goal_name: string
  priority?: number
}

export type UserCondition = {
  id?: string
  user_id: string
  condition_id?: string
  condition_name: string
  severity?: number
  notes?: string
}

export type HealthLog = {
  id: string
  user_id: string
  date: string
  symptoms?: any[]
  meals?: any[]
  medications?: any[]
  notes?: string
}

// Function to get or create a user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null

  // For authenticated users, use Supabase
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  if (!data) {
    // Create a new profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert([{ id: userId }])
      .select()
      .single()

    if (createError) {
      console.error("Error creating user profile:", createError)
      return null
    }

    return newProfile
  }

  return data
}

// Function to update user profile basic info
export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  if (!userId) return null

  // For authenticated users, use Supabase
  const { data, error } = await supabase.from("profiles").update(profileData).eq("id", userId).select().single()

  if (error) {
    console.error("Error updating user profile:", error)
    return null
  }

  return data
}

// Similar updates for saveUserGoals function
export async function saveUserGoals(userId: string, goals: string[]): Promise<boolean> {
  if (!userId || !goals.length) return false

  try {
    // First, check if the user_goals table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from("user_goals")
      .select("id")
      .limit(1)
      .catch((err) => {
        console.error("Error checking user_goals table:", err)
        return { data: null, error: err }
      })

    // If the table doesn't exist, show a more helpful error
    if (tableError && tableError.message.includes("does not exist")) {
      console.error("The user_goals table does not exist. Please run the database schema setup SQL.")
      throw new Error("Database schema not set up correctly. Please contact an administrator.")
    }

    // First, get existing goals from the database
    const { data: existingGoals, error: goalsError } = await supabase.from("goals").select("id, name").in("name", goals)

    if (goalsError) {
      console.error("Error fetching goals:", goalsError)
      throw new Error("Failed to fetch goals")
    }

    // Create any goals that don't exist yet
    const existingGoalNames = existingGoals?.map((g) => g.name) || []
    const newGoalNames = goals.filter((g) => !existingGoalNames.includes(g))

    if (newGoalNames.length > 0) {
      const newGoals = newGoalNames.map((name) => ({ name }))
      const { error: insertError } = await supabase.from("goals").insert(newGoals)

      if (insertError) {
        console.error("Error creating new goals:", insertError)
        throw new Error("Failed to create new goals")
      }
    }

    // Get all goals again (including newly created ones)
    const { data: allGoals, error: fetchError } = await supabase.from("goals").select("id, name").in("name", goals)

    if (fetchError) {
      console.error("Error fetching all goals:", fetchError)
      throw new Error("Failed to fetch all goals")
    }

    if (!allGoals) {
      throw new Error("Failed to retrieve goals")
    }

    // Delete existing user_goals for this user
    const { error: deleteError } = await supabase.from("user_goals").delete().eq("user_id", userId)

    if (deleteError && !deleteError.message.includes("does not exist")) {
      console.error("Error deleting existing user goals:", deleteError)
      throw new Error("Failed to update user goals")
    }

    // Create new user_goals entries
    const userGoals = allGoals.map((goal, index) => ({
      user_id: userId,
      goal_id: goal.id,
      priority: index + 1,
    }))

    const { error: insertUserGoalsError } = await supabase.from("user_goals").insert(userGoals)

    if (insertUserGoalsError) {
      console.error("Error saving user goals:", insertUserGoalsError)
      throw new Error("Failed to save user goals")
    }

    return true
  } catch (error) {
    console.error("Error in saveUserGoals:", error)
    throw error // Re-throw to allow handling in the UI
  }
}

// Function to save user conditions
export async function saveUserConditions(userId: string, conditions: string[]): Promise<boolean> {
  if (!userId || !conditions.length) return false

  try {
    // First, check if the user_conditions table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from("user_conditions")
      .select("id")
      .limit(1)
      .catch((err) => {
        console.error("Error checking user_conditions table:", err)
        return { data: null, error: err }
      })

    // If the table doesn't exist, show a more helpful error
    if (tableError && tableError.message.includes("does not exist")) {
      console.error("The user_conditions table does not exist. Please run the database schema setup SQL.")
      throw new Error("Database schema not set up correctly. Please contact an administrator.")
    }

    // First, get existing conditions from the database
    const { data: existingConditions, error: conditionsError } = await supabase
      .from("conditions")
      .select("id, name")
      .in("name", conditions)

    if (conditionsError) {
      console.error("Error fetching conditions:", conditionsError)
      throw new Error("Failed to fetch conditions")
    }

    // Create any conditions that don't exist yet
    const existingConditionNames = existingConditions?.map((c) => c.name) || []
    const newConditionNames = conditions.filter((c) => !existingConditionNames.includes(c))

    if (newConditionNames.length > 0) {
      const newConditions = newConditionNames.map((name) => ({ name }))
      const { error: insertError } = await supabase.from("conditions").insert(newConditions)

      if (insertError) {
        console.error("Error creating new conditions:", insertError)
        throw new Error("Failed to create new conditions")
      }
    }

    // Get all conditions again (including newly created ones)
    const { data: allConditions, error: fetchError } = await supabase
      .from("conditions")
      .select("id, name")
      .in("name", conditions)

    if (fetchError) {
      console.error("Error fetching all conditions:", fetchError)
      throw new Error("Failed to fetch all conditions")
    }

    if (!allConditions) {
      throw new Error("Failed to retrieve conditions")
    }

    // Delete existing user_conditions for this user
    const { error: deleteError } = await supabase.from("user_conditions").delete().eq("user_id", userId)

    if (deleteError && !deleteError.message.includes("does not exist")) {
      console.error("Error deleting existing user conditions:", deleteError)
      throw new Error("Failed to update user conditions")
    }

    // Create new user_conditions entries
    const userConditions = allConditions.map((condition) => ({
      user_id: userId,
      condition_id: condition.id,
    }))

    const { error: insertUserConditionsError } = await supabase.from("user_conditions").insert(userConditions)

    if (insertUserConditionsError) {
      console.error("Error saving user conditions:", insertUserConditionsError)
      throw new Error("Failed to save user conditions")
    }

    return true
  } catch (error) {
    console.error("Error in saveUserConditions:", error)
    throw error // Re-throw to allow handling in the UI
  }
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
