"use server"
import { getSupabaseClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logging"

// Create a module-specific logger
const goalsActionLogger = logger.createChildLogger("GoalsAction")

// Get user goals
export async function getUserGoals(userId: string): Promise<string[]> {
  if (!userId) {
    throw new Error("User ID is required")
  }

  try {
    const supabase = getSupabaseClient()

    // Get user goals with their associated goal names
    const { data, error } = await supabase
      .from("user_goals")
      .select(`
        goals (
          name
        )
      `)
      .eq("user_id", userId)
      .order("priority")

    if (error) {
      goalsActionLogger.error(`Failed to fetch user goals`, { error })
      throw new Error(`Failed to fetch goals: ${error.message}`)
    }

    // Extract goal names from the result
    const goalNames = data.map((item) => item.goals.name)
    return goalNames
  } catch (error) {
    goalsActionLogger.error(`Error in getUserGoals`, { error })
    throw error
  }
}

// Add a goal for a user
export async function addUserGoal(userId: string, goalName: string): Promise<{ success: boolean; error?: string }> {
  if (!userId || !goalName.trim()) {
    return { success: false, error: "User ID and goal name are required" }
  }

  try {
    const supabase = getSupabaseClient()

    // First, check if the goal exists in the goals table
    const { data: existingGoals, error: goalError } = await supabase.from("goals").select("id").eq("name", goalName)

    let goalId: string

    if (goalError) {
      goalsActionLogger.error(`Error checking for existing goal`, { error: goalError })
      return { success: false, error: `Error checking for existing goal: ${goalError.message}` }
    }

    // If goal exists, use the first one found
    if (existingGoals && existingGoals.length > 0) {
      goalId = existingGoals[0].id
    } else {
      // Goal doesn't exist, create it
      const { data: newGoal, error: createError } = await supabase
        .from("goals")
        .insert([{ name: goalName }])
        .select()
        .single()

      if (createError) {
        goalsActionLogger.error(`Failed to create goal`, { error: createError })
        return { success: false, error: `Failed to create goal: ${createError.message}` }
      }

      goalId = newGoal.id
    }

    // Check if the user already has this goal
    const { data: existingUserGoals, error: userGoalError } = await supabase
      .from("user_goals")
      .select("id")
      .eq("user_id", userId)
      .eq("goal_id", goalId)

    if (!userGoalError && existingUserGoals && existingUserGoals.length > 0) {
      return { success: false, error: "You already have this goal" }
    }

    // Get the highest priority to add the new goal at the end
    const { data: priorityResults, error: priorityError } = await supabase
      .from("user_goals")
      .select("priority")
      .eq("user_id", userId)
      .order("priority", { ascending: false })
      .limit(1)

    const newPriority =
      priorityError || !priorityResults || priorityResults.length === 0 ? 1 : (priorityResults[0]?.priority || 0) + 1

    // Add the goal for the user
    const { error: insertError } = await supabase.from("user_goals").insert([
      {
        user_id: userId,
        goal_id: goalId,
        priority: newPriority,
      },
    ])

    if (insertError) {
      goalsActionLogger.error(`Failed to add user goal`, { error: insertError })
      return { success: false, error: `Failed to add goal: ${insertError.message}` }
    }

    goalsActionLogger.info(`Goal added successfully`, { data: { goalName } })
    return { success: true }
  } catch (error) {
    goalsActionLogger.error(`Error in addUserGoal`, { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Remove a goal for a user
export async function removeUserGoal(userId: string, goalName: string): Promise<{ success: boolean; error?: string }> {
  if (!userId || !goalName.trim()) {
    return { success: false, error: "User ID and goal name are required" }
  }

  try {
    const supabase = getSupabaseClient()

    // First, get the goal ID from the name
    const { data: goal, error: goalError } = await supabase.from("goals").select("id").eq("name", goalName).single()

    if (goalError) {
      goalsActionLogger.error(`Failed to find goal`, { error: goalError })
      return { success: false, error: `Failed to find goal: ${goalError.message}` }
    }

    // Delete the user_goal entry
    const { error: deleteError } = await supabase
      .from("user_goals")
      .delete()
      .eq("user_id", userId)
      .eq("goal_id", goal.id)

    if (deleteError) {
      goalsActionLogger.error(`Failed to remove user goal`, { error: deleteError })
      return { success: false, error: `Failed to remove goal: ${deleteError.message}` }
    }

    goalsActionLogger.info(`Goal removed successfully`, { data: { goalName } })
    return { success: true }
  } catch (error) {
    goalsActionLogger.error(`Error in removeUserGoal`, { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
