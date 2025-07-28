"use server"

import { getServerUser } from "@/lib/supabase/server"
import { getUserHealthContext } from "@/lib/user-context"
import { createSystemPrompt } from "@/lib/chat/system-prompt"
import { openai } from "@ai-sdk/openai"
import { getEnv, canUseAI } from "@/lib/env"
import { logger } from "@/lib/logging"
import { AIServiceError } from "@/types/error"
import { revalidatePath } from "next/cache"
import { getFallbackResponse } from "@/lib/chat/fallback-handler"
import { ensureUserProfile } from "./user-actions"
import { getSupabaseClient } from "@/lib/supabase/server"

// Import the OpenAI logger
import { logOpenAIRequest, logOpenAIResponse, logOpenAIError } from "@/lib/logging/openai-logger"

// Create a module-specific logger
const chatActionLogger = logger.createChildLogger("ChatAction")

export async function processChatMessage(messages: any[]) {
  chatActionLogger.info(`Processing chat message via server action`)

  try {
    // Get the current user from the server session
    const user = await getServerUser()
    const userId = user?.id

    // Check if AI service is available
    if (!canUseAI()) {
      const error = new AIServiceError("AI service is not configured properly. Please contact the administrator.", {
        missingKey: "OPENAI_API_KEY",
      })

      chatActionLogger.error(`AI service not available`, { error })
      throw error
    }

    // Get environment variables
    const env = getEnv()
    chatActionLogger.debug(`Using AI model: ${env.AI_MODEL || "gpt-4o"}`)

    // Get the user's health context
    let userContext = null
    if (userId) {
      chatActionLogger.debug(`Fetching user health context for ${userId.substring(0, 8)}...`)

      try {
        userContext = await getUserHealthContext(userId)
        chatActionLogger.debug(`User context fetched successfully`, {
          data: {
            hasGoals: userContext?.goals?.length > 0,
            hasConditions: userContext?.conditions?.length > 0,
            hasSymptoms: userContext?.recentSymptoms?.length > 0,
          },
        })
      } catch (contextError) {
        chatActionLogger.error(`Failed to fetch user health context`, {
          data: { userId: userId.substring(0, 8) + "..." },
          error: contextError,
        })
        // Continue without user context
      }
    }

    // Create the system prompt with user context
    const systemPrompt = createSystemPrompt(userContext)
    chatActionLogger.debug(`Created system prompt`, {
      data: { length: systemPrompt.length },
    })

    // Prepare messages for OpenAI
    const openaiMessages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ]

    // Log the request to OpenAI
    logOpenAIRequest(env.AI_MODEL || "gpt-4o", openaiMessages)

    try {
      // Create a completion using the OpenAI model
      const response = await openai.chat({
        model: env.AI_MODEL || "gpt-4o",
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 800,
      })

      // Log the full response
      logOpenAIResponse(response)

      // The AI SDK response structure is different from direct OpenAI API
      // It doesn't have a choices array, but instead returns the content directly
      if (!response) {
        throw new Error("No response received from OpenAI API")
      }

      // Extract the assistant's message - with AI SDK, the response itself contains the content
      let assistantMessage: string

      // Check if response has a direct content property (AI SDK format)
      if (response.content !== undefined) {
        assistantMessage = response.content
      } else if (response.choices && response.choices.length > 0 && response.choices[0].message) {
        // Fall back to traditional OpenAI API format if available
        assistantMessage = response.choices[0].message.content
      } else {
        // Log the actual response structure to help debug
        chatActionLogger.error(`Unexpected OpenAI response structure`, {
          data: {
            responseKeys: Object.keys(response),
            responseType: typeof response,
            responsePreview: JSON.stringify(response).substring(0, 500) + "...",
          },
        })
        throw new Error("Unexpected response format from OpenAI API")
      }

      if (!assistantMessage) {
        throw new Error("Empty message content in OpenAI response")
      }

      chatActionLogger.info(`OpenAI response received successfully`)

      // Revalidate the chat page to reflect the new message
      revalidatePath("/")

      return {
        id: Date.now().toString(),
        role: "assistant",
        content: assistantMessage,
      }
    } catch (error) {
      // Log detailed OpenAI error
      logOpenAIError(error)
      chatActionLogger.error(`Error in chat server action`, { error })

      // Return a fallback response instead of throwing
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: getFallbackResponse(error),
      }
    }
  } catch (error) {
    chatActionLogger.error(`Error in chat server action`, { error })

    // Return a fallback response instead of throwing
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: getFallbackResponse(error),
    }
  }
}

// Server action to save user goals
export async function saveUserGoalsAction(goals: string[]) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "User not authenticated" }
    }

    const supabase = getSupabaseClient()

    // Ensure the user profile exists
    await ensureUserProfile(user.id)

    // Get existing goals from the database
    const { data: existingGoals, error: goalsError } = await supabase.from("goals").select("id, name").in("name", goals)

    if (goalsError) {
      return { success: false, error: `Failed to fetch goals: ${goalsError.message}` }
    }

    // Create any goals that don't exist yet
    const existingGoalNames = existingGoals?.map((g) => g.name) || []
    const newGoalNames = goals.filter((g) => !existingGoalNames.includes(g))

    if (newGoalNames.length > 0) {
      const newGoals = newGoalNames.map((name) => ({ name }))
      const { error: insertError } = await supabase.from("goals").insert(newGoals)

      if (insertError) {
        return { success: false, error: `Failed to create new goals: ${insertError.message}` }
      }
    }

    // Get all goals again (including newly created ones)
    const { data: allGoals, error: fetchError } = await supabase.from("goals").select("id, name").in("name", goals)

    if (fetchError || !allGoals) {
      return { success: false, error: `Failed to fetch all goals: ${fetchError?.message || "No goals found"}` }
    }

    // Delete existing user_goals for this user
    const { error: deleteError } = await supabase.from("user_goals").delete().eq("user_id", user.id)

    if (deleteError && !deleteError.message.includes("does not exist")) {
      return { success: false, error: `Failed to update user goals: ${deleteError.message}` }
    }

    // Create new user_goals entries
    const userGoals = allGoals.map((goal, index) => ({
      user_id: user.id,
      goal_id: goal.id,
      priority: index + 1,
    }))

    const { error: insertUserGoalsError } = await supabase.from("user_goals").insert(userGoals)

    if (insertUserGoalsError) {
      return { success: false, error: `Failed to save user goals: ${insertUserGoalsError.message}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Server action to save user conditions
export async function saveUserConditionsAction(conditions: string[]) {
  try {
    const user = await getServerUser()
    if (!user?.id) {
      return { success: false, error: "User not authenticated" }
    }

    const supabase = getSupabaseClient()

    // Ensure the user profile exists
    await ensureUserProfile(user.id)

    // Get existing conditions from the database
    const { data: existingConditions, error: conditionsError } = await supabase
      .from("conditions")
      .select("id, name")
      .in("name", conditions)

    if (conditionsError) {
      return { success: false, error: `Failed to fetch conditions: ${conditionsError.message}` }
    }

    // Create any conditions that don't exist yet
    const existingConditionNames = existingConditions?.map((c) => c.name) || []
    const newConditionNames = conditions.filter((c) => !existingConditionNames.includes(c))

    if (newConditionNames.length > 0) {
      const newConditions = newConditionNames.map((name) => ({ name }))
      const { error: insertError } = await supabase.from("conditions").insert(newConditions)

      if (insertError) {
        return { success: false, error: `Failed to create new conditions: ${insertError.message}` }
      }
    }

    // Get all conditions again (including newly created ones)
    const { data: allConditions, error: fetchError } = await supabase
      .from("conditions")
      .select("id, name")
      .in("name", conditions)

    if (fetchError || !allConditions) {
      return {
        success: false,
        error: `Failed to fetch all conditions: ${fetchError?.message || "No conditions found"}`,
      }
    }

    // Delete existing user_conditions for this user
    const { error: deleteError } = await supabase.from("user_conditions").delete().eq("user_id", user.id)

    if (deleteError && !deleteError.message.includes("does not exist")) {
      return { success: false, error: `Failed to update user conditions: ${deleteError.message}` }
    }

    // Create new user_conditions entries
    const userConditions = allConditions.map((condition) => ({
      user_id: user.id,
      condition_id: condition.id,
    }))

    const { error: insertUserConditionsError } = await supabase.from("user_conditions").insert(userConditions)

    if (insertUserConditionsError) {
      return { success: false, error: `Failed to save user conditions: ${insertUserConditionsError.message}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
