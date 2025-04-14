"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, ClipboardPenLine, Check, X, Undo2 } from "lucide-react"
import { 
    getPendingReminderNotificationsAction, 
    completeReminderNotificationAction, 
    type PendingNotificationTask 
} from "@/app/actions/reminder-schedules"
import { logger } from "@/lib/logger"
import { formatDistanceToNow } from 'date-fns'
import { useToast } from "@/components/ui/use-toast"
import { logMeasurementAction } from "@/app/actions/measurements"
import { logTreatmentAdherenceAction } from "@/app/actions/treatmentAdherence"
import { undoLogAction } from "@/app/actions/undoLog"

interface TrackingInboxProps {
  userId: string;
}

// Type to store details of recently logged tasks
interface LoggedTaskState {
    type: 'measurement' | 'adherence';
    value: number | boolean;
    measurementId?: string; // Store measurement ID for undo
}

export function TrackingInbox({ userId }: TrackingInboxProps) {
  const [tasks, setTasks] = useState<PendingNotificationTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [loggedTasks, setLoggedTasks] = useState<Record<string, LoggedTaskState>>({});
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const refreshTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTasks = await getPendingReminderNotificationsAction(userId);
      setTasks(fetchedTasks);
      
      const initialMeasurementValues: Record<string, string> = {};
      fetchedTasks.forEach(task => {
        if (!(task.notificationId in loggedTasks)) { 
             initialMeasurementValues[task.notificationId] = ""; 
        }
      });
      setMeasurementValues(initialMeasurementValues);

    } catch (error) {
      logger.error("Failed to refresh tracking tasks", { userId, error });
      toast({ title: "Error", description: "Could not refresh tasks.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
       refreshTasks();
  }, [refreshTasks]);

  const handleLogMeasurement = (task: PendingNotificationTask) => {
      const valueStr = measurementValues[task.notificationId] || "";
      const numericValue = parseFloat(valueStr);

      if (isNaN(numericValue)) {
          toast({ title: "Invalid Input", description: "Please enter a valid number.", variant: "destructive"});
          return;
      }

      startTransition(async () => {
          let measurementId: string | undefined = undefined;
          try {
            const measurementInput = {
                userId: userId,
                userVariableId: task.userVariableId,
                globalVariableId: task.globalVariableId,
                value: numericValue,
                reminderNotificationId: task.notificationId
            };
            const logResult = await logMeasurementAction(measurementInput);
            if (!logResult.success || !logResult.data?.id) {
                logger.error("Failed to log measurement", { error: logResult.error, input: measurementInput });
                toast({ title: "Error Logging Measurement", description: logResult.error || "Could not save measurement.", variant: "destructive"});
                return;
            }
            measurementId = logResult.data.id;
            toast({ title: "Measurement Logged", description: `${task.variableName}: ${numericValue} ${task.unitName || ''}`.trim()});
            
            const completeResult = await completeReminderNotificationAction(
                task.notificationId,
                userId, 
                false,
                { measurementId }
            );
            if (!completeResult.success) {
                logger.error("Notification completion failed after logging measurement", { notificationId: task.notificationId, error: completeResult.error });
                toast({ title: "Log Saved, Notification Update Failed", description: completeResult.error || "Could not update reminder status.", variant: "destructive"});
                return;
            }

            setLoggedTasks(prev => ({
                ...prev,
                [task.notificationId]: {
                    type: 'measurement',
                    value: numericValue,
                    measurementId: measurementId,
                }
            }));
            setMeasurementValues(prev => ({ ...prev, [task.notificationId]: '' }));

          } catch (error) {
             logger.error("Error during measurement log/complete process", { error, notificationId: task.notificationId });
             toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"});
          }
      });
  };

  const handleLogAdherence = (task: PendingNotificationTask, taken: boolean) => {
      startTransition(async () => {
          try {
            logger.warn("Using userVariableId as placeholder for patientTreatmentId in adherence log", { userVariableId: task.userVariableId });
            const adherenceInput = {
                userId: userId,
                patientTreatmentId: task.userVariableId,
                taken: taken,
                reminderNotificationId: task.notificationId
            };
            const logResult = await logTreatmentAdherenceAction(adherenceInput);
            if (!logResult.success) {
                logger.error("Failed to log adherence", { error: logResult.error, input: adherenceInput });
                toast({ title: "Error Logging Adherence", description: logResult.error || "Could not save adherence.", variant: "destructive"});
                return;
            }
            toast({ title: "Adherence Logged", description: `${task.variableName}: ${taken ? 'Taken' : 'Skipped/Missed'}`});

            const logDetails = { adherenceLogged: taken };
            const completeResult = await completeReminderNotificationAction(
                task.notificationId,
                userId, 
                false,
                logDetails
            );
            if (!completeResult.success) {
                logger.error("Notification completion failed after logging adherence", { notificationId: task.notificationId, error: completeResult.error });
                toast({ title: "Log Saved, Notification Update Failed", description: completeResult.error || "Could not update reminder status.", variant: "destructive"});
                return;
            }

            setLoggedTasks(prev => ({
                ...prev,
                [task.notificationId]: {
                    type: 'adherence',
                    value: taken,
                }
            }));

         } catch (error) {
            logger.error("Error during adherence log/complete process", { error, notificationId: task.notificationId });
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"});
         }
      });
  };

  const handleUndoLog = (task: PendingNotificationTask) => {
    const loggedState = loggedTasks[task.notificationId];
    if (!loggedState) return;

    startTransition(async () => {
        try {
            const undoInput = {
                userId: userId,
                notificationId: task.notificationId,
                logType: loggedState.type,
                details: {
                    measurementId: loggedState.measurementId
                }
            };
            const result = await undoLogAction(undoInput);
            if (result.success) {
                toast({ title: "Log Undone", description: `Previous log for ${task.variableName} removed.` });
                setLoggedTasks(prev => {
                    const newState = { ...prev };
                    delete newState[task.notificationId];
                    return newState;
                });
                refreshTasks();
       } else {
                logger.error("Failed to undo log", { error: result.error, input: undoInput });
                toast({ title: "Error Undoing Log", description: result.error || "Could not undo the previous log.", variant: "destructive"});
       }
     } catch (error) {
            logger.error("Error calling undo action", { error, notificationId: task.notificationId });
            toast({ title: "Error", description: "An unexpected error occurred during undo.", variant: "destructive"});
        }
    });
  };

  const handleSkipTask = (task: PendingNotificationTask) => {
      if (loggedTasks[task.notificationId]) {
          setLoggedTasks(prev => {
              const newState = { ...prev };
              delete newState[task.notificationId];
              return newState;
          });
      }
      
      startTransition(async () => {
          try {
              const result = await completeReminderNotificationAction(
                  task.notificationId,
                  userId, 
                  true
              );
              if (!result.success) {
                  logger.error("Failed to skip notification", { notificationId: task.notificationId, error: result.error });
                  toast({ title: "Error Skipping Task", description: result.error || "Could not update notification status.", variant: "destructive"});
                  refreshTasks();
              } else {
                  logger.info("Notification skipped successfully", { notificationId: task.notificationId });
                  toast({ title: "Task Skipped", description: `${task.title || task.variableName} marked as skipped.` });
                  setTasks(prev => prev.filter(t => t.notificationId !== task.notificationId));
              }
          } catch (error) {
              logger.error("Error skipping notification", { error, notificationId: task.notificationId });
              toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"});
          }
      });
  };

  const renderTaskControls = (task: PendingNotificationTask) => {
    const loggedState = loggedTasks[task.notificationId];

    if (loggedState) {
        let loggedValueDisplay: string;
        if (loggedState.type === 'measurement') {
            loggedValueDisplay = `${loggedState.value} ${task.unitName || ''}`.trim();
        } else {
            loggedValueDisplay = loggedState.value ? "Taken" : "Skipped/Missed";
        }
        return (
             <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-dashed">
                <p className="text-sm text-muted-foreground italic">
                    Logged: <span className="font-medium text-foreground not-italic">{loggedValueDisplay}</span>
                </p>
                <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUndoLog(task)}
                    disabled={isPending}
                    className="h-7 px-2 text-xs"
                 >
                    <Undo2 className="mr-1 h-3 w-3" /> Undo
                </Button>
            </div>
        );
    }

    const hasUnit = !!task.unitId;
    if (hasUnit) {
        return (
            <div className="flex gap-2 mt-2 items-end">
                <div className="flex-1 grid gap-1">
                    <Label htmlFor={`measure-${task.notificationId}`} className="text-xs">
                        Value {task.unitName ? `(${task.unitName})` : ''}
                    </Label>
                    <Input 
                        id={`measure-${task.notificationId}`}
                        type="number" 
                        step="any"
                        value={measurementValues[task.notificationId] || ''}
                        onChange={(e) => setMeasurementValues(prev => ({ ...prev, [task.notificationId]: e.target.value }))}
                        className="h-8 text-sm"
                        placeholder="Enter value..."
                        disabled={isPending}
                    />
                </div>
                <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleLogMeasurement(task)}
                    disabled={isPending || !measurementValues[task.notificationId]}
                    className="h-8"
                >
                   Log
                </Button>
            </div>
        );
    } else {
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
            <p className="mb-4">No pending tracking notifications.</p>
            <Link href="/patient/reminders" passHref>
              <Button variant="secondary">Manage Reminders</Button>
            </Link>
          </div>
        )}
        
        {tasks.length > 0 && (
          <div className="space-y-4">
            {tasks.map((task) => (
              // Only render tasks that haven't been successfully *skipped* in this session
              // Logged tasks remain visible until skip or refresh
              // Note: Filtering here prevents logged tasks from disappearing immediately
              task.scheduleId in loggedTasks || tasks.find(t => t.scheduleId === task.scheduleId) ? (
                 <div key={task.scheduleId} className="rounded-md border p-4">
                    {/* Task Info */}
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
                        {/* Show Skip only if not already logged */} 
                        {!loggedTasks[task.scheduleId] && (
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
                        )}
                    </div>

                    {/* Inline Controls or Logged State */}    
                    <div className="mt-2">
                        {renderTaskControls(task)}
                    </div>
                </div>
              ) : null // Don't render tasks that were successfully skipped and removed from state
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  )
} 