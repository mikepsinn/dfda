import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logging"
import { handleDatabaseError } from "@/lib/error-handling"

// Create a module-specific logger
const mealLogger = logger.createChildLogger("MealTracker")

export type MealEntry = {
  meal_type: string
  description: string
  time_consumed?: string
  foods?: {
    name: string
    quantity?: number
    unit?: string
  }[]
}

/**
 * Logs a meal for a user on a specific date
 */
export async function logMeal(
  userId: string,
  date: string,
  meal: MealEntry,
): Promise<{ success: boolean; error?: string; mealId?: string }> {
  if (!userId || !date || !meal.description) {
    return { success: false, error: "Missing required data" }
  }

  mealLogger.info(`Logging meal for user`, {
    data: { userId: userId.substring(0, 8) + "...", date, mealType: meal.meal_type },
  })

  try {
    // First, get or create a health log for this date
    let healthLogId: string

    const { data: existingLog, error: logError } = await supabase
      .from("health_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .single()

    if (logError && !logError.message.includes("No rows found")) {
      mealLogger.error(`Error fetching health log`, { error: logError })
      throw handleDatabaseError(logError)
    }

    if (existingLog) {
      healthLogId = existingLog.id
      mealLogger.debug(`Found existing health log`, { data: { healthLogId } })
    } else {
      // Create a new health log
      const { data: newLog, error: createError } = await supabase
        .from("health_logs")
        .insert([{ user_id: userId, date }])
        .select()
        .single()

      if (createError) {
        mealLogger.error(`Error creating health log`, { error: createError })
        throw handleDatabaseError(createError)
      }

      if (!newLog) {
        return { success: false, error: "Failed to create health log" }
      }

      healthLogId = newLog.id
      mealLogger.debug(`Created new health log`, { data: { healthLogId } })
    }

    // Get the meal type ID
    let mealTypeId: string

    const { data: mealType, error: mealTypeError } = await supabase
      .from("meal_types")
      .select("id")
      .eq("name", meal.meal_type)
      .single()

    if (mealTypeError) {
      if (mealTypeError.message.includes("No rows found")) {
        // Create the meal type
        const { data: newMealType, error: createMealTypeError } = await supabase
          .from("meal_types")
          .insert([{ name: meal.meal_type }])
          .select()
          .single()

        if (createMealTypeError) {
          mealLogger.error(`Error creating meal type`, { error: createMealTypeError })
          throw handleDatabaseError(createMealTypeError)
        }

        mealTypeId = newMealType.id
      } else {
        mealLogger.error(`Error fetching meal type`, { error: mealTypeError })
        throw handleDatabaseError(mealTypeError)
      }
    } else {
      mealTypeId = mealType.id
    }

    // Create the meal
    const { data: newMeal, error: mealError } = await supabase
      .from("meals")
      .insert([
        {
          health_log_id: healthLogId,
          meal_type_id: mealTypeId,
          description: meal.description,
          time_consumed: meal.time_consumed,
        },
      ])
      .select()
      .single()

    if (mealError) {
      mealLogger.error(`Error creating meal`, { error: mealError })
      throw handleDatabaseError(mealError)
    }

    const mealId = newMeal.id

    // Add foods if provided
    if (meal.foods && meal.foods.length > 0) {
      for (const food of meal.foods) {
        // Check if the food exists
        let foodId: string

        const { data: existingFood, error: foodError } = await supabase
          .from("foods")
          .select("id")
          .eq("name", food.name)
          .single()

        if (foodError) {
          if (foodError.message.includes("No rows found")) {
            // Create the food
            const { data: newFood, error: createFoodError } = await supabase
              .from("foods")
              .insert([{ name: food.name }])
              .select()
              .single()

            if (createFoodError) {
              mealLogger.error(`Error creating food`, { error: createFoodError })
              throw handleDatabaseError(createFoodError)
            }

            foodId = newFood.id
          } else {
            mealLogger.error(`Error fetching food`, { error: foodError })
            throw handleDatabaseError(foodError)
          }
        } else {
          foodId = existingFood.id
        }

        // Add the food to the meal
        const { error: mealFoodError } = await supabase.from("meal_foods").insert([
          {
            meal_id: mealId,
            food_id: foodId,
            quantity: food.quantity || 1,
            unit: food.unit,
          },
        ])

        if (mealFoodError) {
          mealLogger.error(`Error adding food to meal`, { error: mealFoodError })
          throw handleDatabaseError(mealFoodError)
        }
      }
    }

    mealLogger.info(`Successfully logged meal`, {
      data: { userId: userId.substring(0, 8) + "...", date, mealId },
    })

    return { success: true, mealId }
  } catch (error) {
    mealLogger.error(`Error logging meal`, { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
