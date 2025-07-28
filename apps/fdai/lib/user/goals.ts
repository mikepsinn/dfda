import { supabase } from "@/lib/supabase"

export type UserGoal = {
  id?: string
  user_id: string
  goal_id?: string
  goal_name: string
  priority?: number
}

// Function to save user goals
export async function saveUserGoals(userId: string, goals: string[]): Promise<boolean> {
  if (!userId || !goals.length) return false

  try {
    // First, ensure the user profile exists
    console.log("saveUserGoals: Ensuring user profile exists", { userId })
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (profileError || !profileData) {
      console.log("saveUserGoals: Profile not found, creating it", { userId, error: profileError?.message })
      // Create the profile if it doesn't exist
      const { data: newProfile, error: createProfileError } = await supabase
        .from("profiles")
        .insert([{ id: userId }])
        .select()

      if (createProfileError) {
        console.error("Error creating user profile:", createProfileError)
        throw new Error("Failed to create user profile")
      }

      console.log("saveUserGoals: Created new profile", {
        profileId: newProfile?.[0]?.id,
        success: !!newProfile,
      })

      // Also create notification preferences
      const { error: prefError } = await supabase.from("notification_preferences").insert([{ user_id: userId }])

      if (prefError) {
        console.log("saveUserGoals: Warning - Failed to create notification preferences", {
          error: prefError.message,
        })
        // Continue anyway, this is not critical
      }
    } else {
      console.log("saveUserGoals: User profile exists", { profileId: profileData.id })
    }

    // First, check if the user_goals table exists
    const { data: tableCheck, error: tableError } = await supabase.from("user_goals").select("id").limit(1)

    if (tableError) {
      console.error("Error checking user_goals table:", tableError)
    }

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

    // Get the user's existing goal associations
    const { data: existingUserGoals, error: existingUserGoalsError } = await supabase
      .from("user_goals")
      .select("id, goal_id, priority")
      .eq("user_id", userId)

    if (existingUserGoalsError) {
      console.error("Error fetching user's existing goals:", existingUserGoalsError)
      throw new Error("Failed to fetch user's existing goals")
    }

    // Create a map of existing user goals by goal_id for easy lookup
    const existingUserGoalsMap = new Map()
    existingUserGoals?.forEach((goal) => {
      existingUserGoalsMap.set(goal.goal_id, goal)
    })

    // Get the goal IDs the user currently has
    const existingGoalIds = existingUserGoals?.map((g) => g.goal_id) || []

    // Get the goal IDs the user should have based on the new selection
    const newGoalIds = allGoals.map((g) => g.id)

    // Find goal IDs to remove (in existing but not in new selection)
    const goalIdsToRemove = existingGoalIds.filter((id) => !newGoalIds.includes(id))

    // Find goal IDs to add (in new selection but not in existing)
    const goalIdsToAdd = newGoalIds.filter((id) => !existingGoalIds.includes(id))

    // Remove goals that are no longer selected
    if (goalIdsToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from("user_goals")
        .delete()
        .eq("user_id", userId)
        .in("goal_id", goalIdsToRemove)

      if (removeError) {
        console.error("Error removing goals:", removeError)
        throw new Error("Failed to remove goals")
      }
    }

    // Add new goals
    if (goalIdsToAdd.length > 0) {
      const newUserGoals = goalIdsToAdd.map((goalId, index) => {
        // Find the position of this goal in the original goals array
        const goalName = allGoals.find((g) => g.id === goalId)?.name
        const originalIndex = goals.findIndex((g) => g === goalName)

        return {
          user_id: userId,
          goal_id: goalId,
          priority: originalIndex !== -1 ? originalIndex + 1 : allGoals.length + index + 1,
        }
      })

      const { error: addError } = await supabase.from("user_goals").insert(newUserGoals)

      if (addError) {
        console.error("Error adding new goals:", addError)
        throw new Error("Failed to add new goals")
      }
    }

    // Update priorities for existing goals that remain
    const goalIdsToUpdate = newGoalIds.filter((id) => existingGoalIds.includes(id))

    for (const goalId of goalIdsToUpdate) {
      const goalName = allGoals.find((g) => g.id === goalId)?.name
      const originalIndex = goals.findIndex((g) => g === goalName)

      if (originalIndex !== -1) {
        const { error: updateError } = await supabase
          .from("user_goals")
          .update({ priority: originalIndex + 1 })
          .eq("user_id", userId)
          .eq("goal_id", goalId)

        if (updateError) {
          console.error("Error updating goal priority:", updateError)
          // Continue with other updates even if one fails
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error in saveUserGoals:", error)
    throw error // Re-throw to allow handling in the UI
  }
}
