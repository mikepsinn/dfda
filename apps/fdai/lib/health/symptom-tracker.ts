import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logging"
import { handleDatabaseError } from "@/lib/error-handling"

// Create a module-specific logger
const symptomLogger = logger.createChildLogger("SymptomTracker")

export type SymptomLogEntry = {
  symptom_id: string
  symptom_name: string
  severity: number
  time_of_day?: string
  notes?: string
}

/**
 * Logs symptoms for a user on a specific date
 */
export async function logSymptoms(
  userId: string,
  date: string,
  symptoms: SymptomLogEntry[],
): Promise<{ success: boolean; error?: string; healthLogId?: string }> {
  if (!userId || !symptoms.length) {
    return { success: false, error: "Missing required data" }
  }

  symptomLogger.info(`Logging symptoms for user`, {
    data: { userId: userId.substring(0, 8) + "...", date, symptomCount: symptoms.length },
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
      symptomLogger.error(`Error fetching health log`, { error: logError })
      throw handleDatabaseError(logError)
    }

    if (existingLog) {
      healthLogId = existingLog.id
      symptomLogger.debug(`Found existing health log`, { data: { healthLogId } })
    } else {
      // Create a new health log
      const { data: newLog, error: createError } = await supabase
        .from("health_logs")
        .insert([{ user_id: userId, date }])
        .select()
        .single()

      if (createError) {
        symptomLogger.error(`Error creating health log`, { error: createError })
        throw handleDatabaseError(createError)
      }

      if (!newLog) {
        return { success: false, error: "Failed to create health log" }
      }

      healthLogId = newLog.id
      symptomLogger.debug(`Created new health log`, { data: { healthLogId } })
    }

    // Process each symptom
    for (const symptom of symptoms) {
      // Check if the symptom exists
      let symptomId = symptom.symptom_id

      if (!symptomId) {
        // Look up the symptom by name
        const { data: existingSymptom, error: symptomError } = await supabase
          .from("symptoms")
          .select("id")
          .eq("name", symptom.symptom_name)
          .single()

        if (symptomError && !symptomError.message.includes("No rows found")) {
          symptomLogger.error(`Error fetching symptom`, { error: symptomError })
          throw handleDatabaseError(symptomError)
        }

        if (existingSymptom) {
          symptomId = existingSymptom.id
        } else {
          // Create the symptom
          const { data: newSymptom, error: createSymptomError } = await supabase
            .from("symptoms")
            .insert([{ name: symptom.symptom_name }])
            .select()
            .single()

          if (createSymptomError) {
            symptomLogger.error(`Error creating symptom`, { error: createSymptomError })
            throw handleDatabaseError(createSymptomError)
          }

          symptomId = newSymptom.id
        }
      }

      // Check if this symptom is already logged for this health log
      const { data: existingSymptomLog, error: symptomLogError } = await supabase
        .from("symptom_logs")
        .select("id")
        .eq("health_log_id", healthLogId)
        .eq("symptom_id", symptomId)
        .single()

      if (symptomLogError && !symptomLogError.message.includes("No rows found")) {
        symptomLogger.error(`Error checking symptom log`, { error: symptomLogError })
        throw handleDatabaseError(symptomLogError)
      }

      if (existingSymptomLog) {
        // Update the existing symptom log
        const { error: updateError } = await supabase
          .from("symptom_logs")
          .update({
            severity: symptom.severity,
            time_of_day: symptom.time_of_day,
            notes: symptom.notes,
          })
          .eq("id", existingSymptomLog.id)

        if (updateError) {
          symptomLogger.error(`Error updating symptom log`, { error: updateError })
          throw handleDatabaseError(updateError)
        }
      } else {
        // Create a new symptom log
        const { error: insertError } = await supabase.from("symptom_logs").insert([
          {
            health_log_id: healthLogId,
            symptom_id: symptomId,
            severity: symptom.severity,
            time_of_day: symptom.time_of_day,
            notes: symptom.notes,
          },
        ])

        if (insertError) {
          symptomLogger.error(`Error creating symptom log`, { error: insertError })
          throw handleDatabaseError(insertError)
        }
      }
    }

    symptomLogger.info(`Successfully logged symptoms`, {
      data: { userId: userId.substring(0, 8) + "...", date, symptomCount: symptoms.length },
    })

    return { success: true, healthLogId }
  } catch (error) {
    symptomLogger.error(`Error logging symptoms`, { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Gets symptoms for a user on a specific date
 */
export async function getSymptoms(
  userId: string,
  date: string,
): Promise<{ success: boolean; data?: SymptomLogEntry[]; error?: string }> {
  if (!userId || !date) {
    return { success: false, error: "Missing required data" }
  }

  symptomLogger.info(`Getting symptoms for user`, {
    data: { userId: userId.substring(0, 8) + "...", date },
  })

  try {
    const { data: healthLog, error: logError } = await supabase
      .from("health_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .single()

    if (logError) {
      if (logError.message.includes("No rows found")) {
        // No health log for this date means no symptoms
        return { success: true, data: [] }
      }

      symptomLogger.error(`Error fetching health log`, { error: logError })
      throw handleDatabaseError(logError)
    }

    const { data: symptomLogs, error: logsError } = await supabase
      .from("symptom_logs")
      .select(`
        id,
        severity,
        time_of_day,
        notes,
        symptoms (
          id,
          name
        )
      `)
      .eq("health_log_id", healthLog.id)

    if (logsError) {
      symptomLogger.error(`Error fetching symptom logs`, { error: logsError })
      throw handleDatabaseError(logsError)
    }

    const formattedLogs: SymptomLogEntry[] = symptomLogs.map((log) => ({
      symptom_id: log.symptoms.id,
      symptom_name: log.symptoms.name,
      severity: log.severity,
      time_of_day: log.time_of_day,
      notes: log.notes,
    }))

    return { success: true, data: formattedLogs }
  } catch (error) {
    symptomLogger.error(`Error getting symptoms`, { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
