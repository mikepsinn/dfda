"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import {
  type PendingReminderTask,
  completeReminderTaskAction,
} from "@/app/actions/reminder-schedules";
import { logTreatmentAdherenceAction } from "@/app/actions/treatmentAdherence"; // Import placeholder action

interface TreatmentAdherenceDialogProps {
  task: PendingReminderTask | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TreatmentAdherenceDialog({
  task,
  userId,
  isOpen,
  onClose,
}: TreatmentAdherenceDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (taken: boolean) => {
    if (!task) return;

    startTransition(async () => {
      try {
        // TODO: We need the actual patient_treatment.id, not user_variable.id.
        // This requires fetching based on userVariableId or modifying the task data.
        // For the placeholder, we'll just use userVariableId and log a warning.
        logger.warn(
          "Using userVariableId as placeholder for patientTreatmentId in adherence log",
          { userVariableId: task.userVariableId }
        );
        const adherenceInput = {
          userId: userId,
          patientTreatmentId: task.userVariableId, // Placeholder!
          taken: taken,
        };

        logger.info("Submitting treatment adherence log", { adherenceInput });
        const adherenceResult = await logTreatmentAdherenceAction(adherenceInput);

        if (!adherenceResult.success) {
          logger.error("Failed to log treatment adherence", {
            error: adherenceResult.error,
            input: adherenceInput,
          });
          toast({
            title: "Error Logging Adherence",
            description:
              adherenceResult.error || "An unexpected error occurred.",
            variant: "destructive",
          });
          return;
        }

        logger.info(
          "Treatment adherence logged successfully, completing task",
          { scheduleId: task.scheduleId }
        );

        const completeResult = await completeReminderTaskAction(
          task.scheduleId,
          userId,
          false,
          { adherenceLogged: taken } // Pass log data
        );

        if (!completeResult.success) {
          logger.error(
            "Failed to complete reminder task after logging adherence",
            { error: completeResult.error, scheduleId: task.scheduleId }
          );
          toast({
            title: "Adherence Logged, Task Update Failed",
            description:
              completeResult.error ||
              "Could not update the reminder task status.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Adherence Logged",
            description: `${task.variableName} adherence recorded successfully.`,
          });
        }
        onClose();
      } catch (error) {
        logger.error("Error during adherence submission", { error });
        toast({
          title: "Submission Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Adherence: {task.variableName}</DialogTitle>
          <DialogDescription>
            {task.message || `Did you take your ${task.variableName} as scheduled?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-4 sm:justify-center">
          <Button 
            variant="outline" 
            onClick={() => handleSubmit(false)} 
            disabled={isPending}
            className="flex-1"
           >
            {isPending ? "Logging..." : "No, Skipped/Missed"}
          </Button>
          <Button 
            onClick={() => handleSubmit(true)} 
            disabled={isPending}
            className="flex-1"
           >
            {isPending ? "Logging..." : "Yes, Taken"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 