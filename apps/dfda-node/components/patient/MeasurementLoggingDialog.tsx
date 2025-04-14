"use client"

import { useState, useEffect, useTransition } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { logger } from "@/lib/logger"
import { type PendingReminderTask, completeReminderTaskAction } from "@/app/actions/reminder-schedules"
import { logMeasurementAction } from "@/app/actions/measurements"

interface MeasurementLoggingDialogProps {
  task: PendingReminderTask | null; // Allow null when not open
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MeasurementLoggingDialog({ task, userId, isOpen, onClose }: MeasurementLoggingDialogProps) {
  const [value, setValue] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Reset state when the dialog opens with a new task or closes
  useEffect(() => {
    if (isOpen && task) {
      setValue("");
      setNotes("");
    } else if (!isOpen) {
        // Optional: Clear state when closing, though re-opening will reset anyway
        // setValue("");
        // setNotes("");
    }
  }, [isOpen, task]);

  const handleSubmit = async () => {
    if (!task) return; // Should not happen if dialog is open correctly

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
        toast({
            title: "Invalid Input",
            description: "Please enter a valid number for the measurement.",
            variant: "destructive",
        });
        return;
    }

    startTransition(async () => {
        try {
            const measurementInput = {
                userId: userId,
                userVariableId: task.userVariableId,
                globalVariableId: task.globalVariableId,
                value: numericValue,
                notes: notes || undefined,
            };

            logger.info("Submitting measurement log", { measurementInput });
            const measurementResult = await logMeasurementAction(measurementInput);

            if (!measurementResult.success) {
                logger.error("Failed to log measurement", { error: measurementResult.error, input: measurementInput });
                toast({
                    title: "Error Logging Measurement",
                    description: measurementResult.error || "An unexpected error occurred.",
                    variant: "destructive",
                });
                return; 
            }
            
            logger.info("Measurement logged successfully, completing task", { scheduleId: task.scheduleId });

            const completeResult = await completeReminderTaskAction(
                task.scheduleId, 
                userId, 
                false, 
                { measurementId: measurementResult.data?.id } 
            );

            if (!completeResult.success) {
                 logger.error("Failed to complete reminder task after logging measurement", { error: completeResult.error, scheduleId: task.scheduleId });
                 toast({
                    title: "Measurement Logged, Task Update Failed",
                    description: completeResult.error || "Could not update the reminder task status.",
                    variant: "destructive",
                 });
            } else {
                 toast({
                    title: "Measurement Logged",
                    description: `${task.variableName} measurement recorded successfully.`,
                 });
            }
            onClose();
        } catch (error) {
            logger.error("Error during measurement submission", { error });
            toast({
                title: "Submission Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    });
  };

  if (!task) return null; // Don't render if no task is selected

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Measurement: {task.variableName}</DialogTitle>
          <DialogDescription>
            Enter the value for your measurement. The default unit will be used if applicable.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={`measurement-value-${task.scheduleId}`} className="text-right">
              Value
            </Label>
            <Input
              id={`measurement-value-${task.scheduleId}`}
              type="number" 
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="col-span-3"
              disabled={isPending}
              required // Make value field required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={`measurement-notes-${task.scheduleId}`} className="text-right">
              Notes
            </Label>
            <Textarea
              id={`measurement-notes-${task.scheduleId}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="(Optional) Add any relevant notes..."
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !value}> 
            {isPending ? "Logging..." : "Log Measurement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 