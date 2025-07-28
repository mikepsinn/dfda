import { supabase } from "@/lib/supabase"
import { DatabaseError, NotFoundError } from "@/types/error"
import { handleDatabaseError } from "@/lib/error-handling"
import { validateRequired, validateNonEmptyArray } from "@/lib/validation"
import { logger } from "@/lib/logging"

export type UserConditionType = {
  id?: string
  user_id: string
  condition_id?: string
  condition_name: string
  severity?: number
  notes?: string
}

// Create a module-specific logger
const conditionsLogger = logger.createChildLogger("UserConditions")

export async function saveUserConditions(userId: string, conditions: string[]): Promise<boolean> {
  conditionsLogger.info(`Starting to save conditions for user`, {
    data: { userId, conditions },
  })

  try {
    // Validate inputs
    validateRequired(userId, "User ID")
    validateNonEmptyArray(conditions, "Conditions")

    // First, ensure the user profile exists
    conditionsLogger.debug(`Ensuring user profile exists`, { data: { userId } })

    try {
      const { data, error } = await supabase.from("profiles").select("id").eq("id", userId).single()

      if (error) {
        conditionsLogger.error(`Failed to check if user profile exists`, {
          data: { userId },
          error,
        })
        throw handleDatabaseError(error)
      }

      if (!data) {
        conditionsLogger.info(`Profile not found, creating it`, { data: { userId } })

        try {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([{ id: userId }])
            .select()

          if (createError) {
            conditionsLogger.error(`Failed to create user profile`, {
              data: { userId },
              error: createError,
            })
            throw handleDatabaseError(createError)
          }

          if (!newProfile || newProfile.length === 0) {
            const noDataError = new DatabaseError("Failed to create user profile - no data returned")
            conditionsLogger.error(`No profile data returned after creation`, {
              data: { userId },
            })
            throw noDataError
          }

          conditionsLogger.info(`Created new profile successfully`, {
            data: { profileId: newProfile[0]?.id },
          })

          // Also create notification preferences
          try {
            const { error: prefError } = await supabase.from("notification_preferences").insert([{ user_id: userId }])

            if (prefError) {
              conditionsLogger.warn(`Failed to create notification preferences, continuing anyway`, {
                data: { userId },
                error: prefError,
              })
            } else {
              conditionsLogger.debug(`Created notification preferences`, { data: { userId } })
            }
          } catch (prefCreateError) {
            conditionsLogger.warn(`Exception creating notification preferences, continuing anyway`, {
              data: { userId },
              error: prefCreateError,
            })
          }
        } catch (profileCreateError) {
          conditionsLogger.error(`Exception creating user profile`, {
            data: { userId },
            error: profileCreateError,
          })
          throw profileCreateError
        }
      } else {
        conditionsLogger.debug(`User profile exists`, { data: { profileId: data.id } })
      }
    } catch (profileCheckError) {
      conditionsLogger.error(`Exception checking/creating user profile`, {
        data: { userId },
        error: profileCheckError,
      })
      throw profileCheckError
    }

    // Check if the user_conditions table exists
    conditionsLogger.debug(`Checking if user_conditions table exists`)

    try {
      const { data: tableCheck, error: tableError } = await supabase.from("user_conditions").select("id").limit(1)

      if (tableError) {
        conditionsLogger.error(`Error checking user_conditions table`, {
          error: tableError,
          data: {
            message: tableError.message,
            code: tableError.code,
            hint: tableError.hint || "No hint provided",
          },
        })

        // If the table doesn't exist, throw a specific error
        if (tableError.message.includes("does not exist")) {
          const schemaError = new DatabaseError(
            "The user_conditions table does not exist. Please run the database schema setup SQL.",
            { tableError },
          )
          conditionsLogger.error(`Database schema issue - table does not exist`, {
            data: { table: "user_conditions" },
          })
          throw schemaError
        }

        throw handleDatabaseError(tableError)
      } else {
        conditionsLogger.debug(`Table check successful`, {
          data: { recordsFound: tableCheck?.length || 0 },
        })
      }
    } catch (tableCheckError) {
      conditionsLogger.error(`Exception checking user_conditions table`, {
        error: tableCheckError,
      })
      throw tableCheckError
    }

    // Get existing conditions from the database
    conditionsLogger.debug(`Fetching existing conditions from database`)

    let existingConditions = []
    try {
      const { data, error } = await supabase.from("conditions").select("id, name").in("name", conditions)

      if (error) {
        conditionsLogger.error(`Failed to fetch conditions`, {
          data: { conditions },
          error,
        })
        throw handleDatabaseError(error)
      }

      existingConditions = data || []
      conditionsLogger.debug(`Existing conditions found`, {
        data: {
          count: existingConditions.length,
          conditions: existingConditions.map((c) => c.name),
        },
      })
    } catch (fetchConditionsError) {
      conditionsLogger.error(`Exception fetching conditions`, {
        data: { conditions },
        error: fetchConditionsError,
      })
      throw fetchConditionsError
    }

    // Create any conditions that don't exist yet
    const existingConditionNames = existingConditions.map((c) => c.name)
    const newConditionNames = conditions.filter((c) => !existingConditionNames.includes(c))

    conditionsLogger.debug(`New conditions to create`, {
      data: {
        count: newConditionNames.length,
        newConditions: newConditionNames,
      },
    })

    if (newConditionNames.length > 0) {
      const newConditions = newConditionNames.map((name) => ({ name }))
      conditionsLogger.debug(`Inserting new conditions`, { data: { newConditions } })

      try {
        const { data, error } = await supabase.from("conditions").insert(newConditions).select()

        if (error) {
          conditionsLogger.error(`Failed to create new conditions`, {
            data: { newConditions },
            error,
          })
          throw handleDatabaseError(error)
        }

        conditionsLogger.debug(`Successfully inserted new conditions`, {
          data: { inserted: data?.length || 0 },
        })
      } catch (createConditionsError) {
        conditionsLogger.error(`Exception creating new conditions`, {
          data: { newConditions },
          error: createConditionsError,
        })
        throw createConditionsError
      }
    }

    // Get all conditions again (including newly created ones)
    conditionsLogger.debug(`Fetching all conditions (including newly created)`)

    let allConditions = []
    try {
      const { data, error } = await supabase.from("conditions").select("id, name").in("name", conditions)

      if (error) {
        conditionsLogger.error(`Failed to fetch all conditions`, {
          data: { conditions },
          error,
        })
        throw handleDatabaseError(error)
      }

      if (!data || data.length === 0) {
        const notFoundError = new NotFoundError("Failed to retrieve conditions")
        conditionsLogger.error(`No conditions found after creation`, {
          data: { conditions },
        })
        throw notFoundError
      }

      allConditions = data
      conditionsLogger.debug(`All conditions fetched successfully`, {
        data: {
          count: allConditions.length,
          conditions: allConditions.map((c) => ({ id: c.id, name: c.name })),
        },
      })
    } catch (fetchAllConditionsError) {
      conditionsLogger.error(`Exception fetching all conditions`, {
        data: { conditions },
        error: fetchAllConditionsError,
      })
      throw fetchAllConditionsError
    }

    // Get the user's existing condition associations
    conditionsLogger.debug(`Fetching user's existing conditions`)

    let existingUserConditions = []
    try {
      const { data, error } = await supabase
        .from("user_conditions")
        .select("id, condition_id, severity, diagnosed_date, notes")
        .eq("user_id", userId)

      if (error) {
        conditionsLogger.error(`Failed to fetch user's existing conditions`, {
          data: { userId },
          error,
        })
        throw handleDatabaseError(error)
      }

      existingUserConditions = data || []
      conditionsLogger.debug(`User's existing conditions`, {
        data: {
          count: existingUserConditions.length,
          existingUserConditions,
        },
      })
    } catch (fetchUserConditionsError) {
      conditionsLogger.error(`Exception fetching user's existing conditions`, {
        data: { userId },
        error: fetchUserConditionsError,
      })
      throw fetchUserConditionsError
    }

    // Create a map of existing user conditions by condition_id for easy lookup
    const existingUserConditionsMap = new Map()
    existingUserConditions.forEach((condition) => {
      existingUserConditionsMap.set(condition.condition_id, condition)
    })

    // Get the condition IDs the user currently has
    const existingConditionIds = existingUserConditions.map((c) => c.condition_id)

    // Get the condition IDs the user should have based on the new selection
    const newConditionIds = allConditions.map((c) => c.id)

    // Find condition IDs to remove (in existing but not in new selection)
    const conditionIdsToRemove = existingConditionIds.filter((id) => !newConditionIds.includes(id))

    // Find condition IDs to add (in new selection but not in existing)
    const conditionIdsToAdd = newConditionIds.filter((id) => !existingConditionIds.includes(id))

    conditionsLogger.debug(`Changes to make`, {
      data: {
        conditionIdsToRemove,
        conditionIdsToAdd,
      },
    })

    // Remove conditions that are no longer selected
    if (conditionIdsToRemove.length > 0) {
      conditionsLogger.debug(`Removing conditions no longer selected`, {
        data: { conditionIdsToRemove },
      })

      try {
        const { error } = await supabase
          .from("user_conditions")
          .delete()
          .eq("user_id", userId)
          .in("condition_id", conditionIdsToRemove)

        if (error) {
          conditionsLogger.error(`Failed to remove conditions`, {
            data: { userId, conditionIdsToRemove },
            error,
          })
          throw handleDatabaseError(error)
        }

        conditionsLogger.debug(`Successfully removed conditions`)
      } catch (removeConditionsError) {
        conditionsLogger.error(`Exception removing conditions`, {
          data: { userId, conditionIdsToRemove },
          error: removeConditionsError,
        })
        throw removeConditionsError
      }
    }

    // Add new conditions
    if (conditionIdsToAdd.length > 0) {
      conditionsLogger.debug(`Adding new conditions`, { data: { conditionIdsToAdd } })

      const newUserConditions = conditionIdsToAdd.map((conditionId) => ({
        user_id: userId,
        condition_id: conditionId,
      }))

      try {
        const { error } = await supabase.from("user_conditions").insert(newUserConditions)

        if (error) {
          conditionsLogger.error(`Failed to add new conditions`, {
            data: { userId, newUserConditions },
            error,
          })
          throw handleDatabaseError(error)
        }

        conditionsLogger.debug(`Successfully added new conditions`)
      } catch (addConditionsError) {
        conditionsLogger.error(`Exception adding new conditions`, {
          data: { userId, newUserConditions },
          error: addConditionsError,
        })
        throw addConditionsError
      }
    }

    conditionsLogger.info(`Successfully updated user conditions`, {
      data: { userId, conditionsCount: conditions.length },
    })
    return true
  } catch (error) {
    conditionsLogger.error(`Failed to save user conditions`, {
      data: { userId, conditions },
      error,
    })
    throw error // Re-throw to allow handling in the UI
  }
}
