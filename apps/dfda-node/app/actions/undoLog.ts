"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

interface UndoLogInput {
  userId: string;
  notificationId: string;
  logType: "measurement" | "adherence";
  details: {
    measurementId?: string;
    // Add other details if needed for undoing adherence, etc.
  };
}

export async function undoLogAction(
  input: UndoLogInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  logger.info("Attempting to undo log", { input });

  const { userId, notificationId, logType, details } = input;

  // Validate input
  if (!userId || !notificationId || !logType) {
    logger.error("Missing required fields for undoLogAction", { input });
    return { success: false, error: "Missing required information to undo." };
  }
  if (logType === "measurement" && !details.measurementId) {
    logger.error("Missing measurementId for undoing measurement", { input });
    return { success: false, error: "Missing measurement ID for undo." };
  }

  try {
    // --- Step 1: Undo the specific log entry --- 
    if (logType === "measurement") {
      if (!details.measurementId) {
        logger.error("Cannot undo measurement without measurementId", { input });
        throw new Error("Internal error: Missing measurement ID for undo.");
      }
      const { error: deleteMeasurementError } = await supabase
        .from("measurements")
        .delete()
        .eq("id", details.measurementId)
        .eq("user_id", userId);

      if (deleteMeasurementError) {
        logger.error("Error deleting measurement during undo", {
          error: deleteMeasurementError,
          input,
        });
        throw new Error("Could not delete the measurement log.");
      }
      logger.info("Measurement deleted successfully for undo", {
        measurementId: details.measurementId,
      });
    } else if (logType === "adherence") {
      // --- TODO: Implement Adherence Undo Logic --- 
      // This depends heavily on how adherence is logged in logTreatmentAdherenceAction
      // - If it updated patient_treatments, revert the change.
      // - If it inserted into measurements, delete that row.
      // - If it inserted into adherence_log, delete that row.
      logger.warn("Undo for adherence log not fully implemented yet", { input });
      // For now, we proceed to reset the trigger time
      // --- End TODO ---
    }

    // --- Step 2: Reset the reminder notification's status --- 
    const { error: updateNotificationError } = await supabase
      .from("reminder_notifications")
      .update({ 
          status: 'pending', 
          completed_or_skipped_at: null, 
          log_details: null 
       })
      .eq("id", notificationId)
      .eq("user_id", userId); // Ensure user owns the notification

    if (updateNotificationError) {
      logger.error("Error resetting notification status during undo", {
        error: updateNotificationError,
        input,
      });
      throw new Error("Could not reset the reminder notification status.");
    }
    logger.info("Reminder notification status reset successfully", {
      notificationId,
    });

    // --- Step 3: Revalidate Paths --- 
    revalidatePath(`/patient`);
    revalidatePath(`/patient/dashboard`);
    revalidatePath(`/components/patient/TrackingInbox`);
    // Revalidate measurement/adherence specific pages if they exist

    return { success: true };
    
  } catch (error) {
    logger.error("Error in undoLogAction", {
      error: error instanceof Error ? error.message : String(error),
      input,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
    };
  }
} 