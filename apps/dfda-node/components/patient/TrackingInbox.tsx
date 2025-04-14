"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, ClipboardPenLine, Check, X } from "lucide-react"
import { 
    getPendingReminderTasksAction, 
    completeReminderTaskAction, 
    type PendingReminderTask 
} from "@/app/actions/reminder-schedules"
import { logger } from "@/lib/logger"
import { formatDistanceToNow } from 'date-fns'
import { useToast } from "@/components/ui/use-toast"
import { logMeasurementAction } from "@/app/actions/measurements"
import { logTreatmentAdherenceAction } from "@/app/actions/treatmentAdherence"

interface TrackingInboxProps {
  userId: string;
  initialTasks?: PendingReminderTask[];
}

export function TrackingInbox({ userId, initialTasks = [] }: TrackingInboxProps) {
  const [tasks, setTasks] = useState<PendingReminderTask[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(initialTasks.length === 0);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const refreshTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTasks = await getPendingReminderTasksAction(userId);
      setTasks(fetchedTasks);
      setMeasurementValues({});
    } catch (error) {
      logger.error("Failed to refresh tracking tasks", { userId, error });
      toast({ title: "Error", description: "Could not refresh tasks.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (initialTasks.length === 0) {
       refreshTasks();
    }
    const initialValues: Record<string, string> = {};
    initialTasks.forEach(task => {
        initialValues[task.scheduleId] = "";
    });
    setMeasurementValues(initialValues);

  }, [initialTasks, refreshTasks]);

  const handleSuccessfulLog = async (task: PendingReminderTask, logDetails: any) => {
     logger.info("Log successful, completing task", { scheduleId: task.scheduleId, logDetails });
     const completeResult = await completeReminderTaskAction(task.scheduleId, userId, false, logDetails);
     if (!completeResult.success) {
         logger.error("Task completion failed after logging", { scheduleId: task.scheduleId, error: completeResult.error });
         toast({ title: "Log Saved, Task Update Failed", description: completeResult.error || "Could not update reminder status.", variant: "destructive"});
         refreshTasks(); 
     } else {
        logger.info("Task completed successfully after log", { scheduleId: task.scheduleId });
        setTasks(prev => prev.filter(t => t.scheduleId !== task.scheduleId));
        setMeasurementValues(prev => ({ ...prev, [task.scheduleId]: '' })); 
     }
  };

  const handleLogMeasurement = (task: PendingReminderTask) => {
      const valueStr = measurementValues[task.scheduleId] || "";
      const numericValue = parseFloat(valueStr);

      if (isNaN(numericValue)) {
          toast({ title: "Invalid Input", description: "Please enter a valid number.", variant: "destructive"});
          return;
      }

      startTransition(async () => {
          try {
            const measurementInput = {
                userId: userId,
                userVariableId: task.userVariableId,
                globalVariableId: task.globalVariableId,
                value: numericValue,
            };
            const result = await logMeasurementAction(measurementInput);
            if (result.success) {
                toast({ title: "Measurement Logged", description: `${task.variableName}: ${numericValue}`});
                await handleSuccessfulLog(task, { measurementId: result.data?.id });
            } else {
                logger.error("Failed to log measurement", { error: result.error, input: measurementInput });
                toast({ title: "Error Logging Measurement", description: result.error || "Could not save measurement.", variant: "destructive"});
            }
          } catch (error) {
             logger.error("Error submitting measurement", { error, scheduleId: task.scheduleId });
             toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"});
          }
      });
  };

  const handleLogAdherence = (task: PendingReminderTask, taken: boolean) => {
      startTransition(async () => {
         try {
            logger.warn("Using userVariableId as placeholder for patientTreatmentId in adherence log", { userVariableId: task.userVariableId });
            const adherenceInput = {
                userId: userId,
                patientTreatmentId: task.userVariableId,
                taken: taken,
            };
            const result = await logTreatmentAdherenceAction(adherenceInput);
            if (result.success) {
                toast({ title: "Adherence Logged", description: `${task.variableName}: ${taken ? 'Taken' : 'Skipped/Missed'}`});
                await handleSuccessfulLog(task, { adherenceLogged: taken });
            } else {
                logger.error("Failed to log adherence", { error: result.error, input: adherenceInput });
                toast({ title: "Error Logging Adherence", description: result.error || "Could not save adherence.", variant: "destructive"});
            }
         } catch (error) {
            logger.error("Error submitting adherence", { error, scheduleId: task.scheduleId });
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"});
         }
      });
  };

  const handleSkipTask = (task: PendingReminderTask) => {
      startTransition(async () => {
          try {
              const result = await completeReminderTaskAction(task.scheduleId, userId, true);
              if (!result.success) {
                  logger.error("Failed to skip task", { scheduleId: task.scheduleId, error: result.error });
                  toast({ title: "Error Skipping Task", description: result.error || "Could not update reminder status.", variant: "destructive"});
                  refreshTasks();
              } else {
                  logger.info("Task skipped successfully", { scheduleId: task.scheduleId });
                  toast({ title: "Task Skipped", description: `${task.title || task.variableName} marked as skipped.` });
                  setTasks(prev => prev.filter(t => t.scheduleId !== task.scheduleId));
              }
          } catch (error) {
              logger.error("Error skipping task", { error, scheduleId: task.scheduleId });
              toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"});
          }
      });
  };

  const renderTaskControls = (task: PendingReminderTask) => {
    // Prioritize unit ID for determining control type
    const hasUnit = !!task.unitId;

    if (hasUnit) {
        // Measurement: Input + Log button
        return (
            <div className="flex gap-2 mt-2 items-end">
                <div className="flex-1 grid gap-1">
                    {/* Display unit name next to label */}
                    <Label htmlFor={`measure-${task.scheduleId}`} className="text-xs">
                        Value {task.unitName ? `(${task.unitName})` : ''}
                    </Label>
                    <Input 
                        id={`measure-${task.scheduleId}`}
                        type="number" 
                        step="any"
                        value={measurementValues[task.scheduleId] || ''}
                        onChange={(e) => setMeasurementValues(prev => ({ ...prev, [task.scheduleId]: e.target.value }))}
                        className="h-8 text-sm"
                        placeholder="Enter value..."
                        disabled={isPending}
                    />
                </div>
                <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleLogMeasurement(task)}
                    disabled={isPending || !measurementValues[task.scheduleId]}
                    className="h-8"
                >
                   Log
                </Button>
            </div>
        );
    } else {
       // No Unit -> Assume Adherence: Yes/No buttons
       // TODO: This might need refinement if there are other unit-less task types (e.g., free text log)
        return (
            <div className="flex gap-2 mt-2">
                <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleLogAdherence(task, false)}
                    disabled={isPending}
                    className="flex-1"
                >
                    <X className="mr-1 h-4 w-4" /> No / Missed
                </Button>
                 <Button 
                    size="sm" 
                    onClick={() => handleLogAdherence(task, true)}
                    disabled={isPending}
                    className="flex-1"
                >
                    <Check className="mr-1 h-4 w-4" /> Yes / Taken
                </Button>
            </div>
        );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking Inbox</CardTitle>
        <CardDescription>Log measurements, adherence, or symptoms as needed.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading tasks...</p>} 
        {!isLoading && tasks.length === 0 && (
          <div className="text-center text-muted-foreground">
            <p className="mb-4">No pending tracking tasks.</p>
            <Link href="/patient/reminders" passHref>
              <Button variant="secondary">Manage Reminders</Button>
            </Link>
          </div>
        )}
        
        {tasks.length > 0 && (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.scheduleId} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                        <p className="font-medium">{task.title || task.variableName}</p>
                        {task.message && (
                            <p className="text-sm text-muted-foreground">{task.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Due: {formatDistanceToNow(new Date(task.dueAt), { addSuffix: true })}
                            {' '}({new Date(task.dueAt).toLocaleTimeString([], { timeStyle: 'short' })})
                        </p>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-muted-foreground hover:bg-secondary/80"
                        onClick={() => handleSkipTask(task)}
                        disabled={isPending}
                        aria-label="Skip task"
                    >
                        <Clock className="h-4 w-4" />
                        <span className="sr-only">Skip</span>
                    </Button>
                </div>

                <div className="mt-2">
                    {renderTaskControls(task)}
                </div>

              </div>
            ))}
          </div>
        )}
        
      </CardContent>
    </Card>
  )
} 