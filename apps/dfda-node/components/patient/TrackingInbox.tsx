"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Undo2 } from "lucide-react"
import { 
    getPendingReminderNotificationsAction, 
    completeReminderNotificationAction, 
    type PendingNotificationTask 
} from "@/app/actions/reminder-schedules"
import { logger } from "@/lib/logger"
import { formatDistanceToNow } from 'date-fns'
import { useToast } from "@/components/ui/use-toast"
import { logMeasurementAction } from "@/app/actions/measurements"
import { undoLogAction } from "@/app/actions/undoLog"

interface TrackingInboxProps {
  userId: string;
}

// Type to store details of recently logged tasks (simplified for measurements only)
interface LoggedTaskState {
    type: 'measurement'; // Only measurement type for now
    value: number;
    measurementId: string; // Store measurement ID for undo
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
  }, [userId, toast, loggedTasks]);

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
                { measurementId } // Log details now only contain measurementId
            );
            if (!completeResult.success) {
                logger.error("Notification completion failed after logging measurement", { notificationId: task.notificationId, error: completeResult.error });
                toast({ title: "Log Saved, Notification Update Failed", description: completeResult.error || "Could not update reminder status.", variant: "destructive"});
                // Note: We still recorded the log, so update local state
            }

            // Update local state regardless of completion success
            setLoggedTasks(prev => ({
                ...prev,
                [task.notificationId]: {
                    type: 'measurement',
                    value: numericValue,
                    measurementId: measurementId!, // Assert non-null as we checked logResult.success
                }
            }));
            setMeasurementValues(prev => ({ ...prev, [task.notificationId]: '' }));

          } catch (error) {
             logger.error("Error during measurement log/complete process", { error, notificationId: task.notificationId });
             toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"});
          }
      });
  };

  const handleUndo = useCallback(async (logId: string | undefined, logType: 'measurement') => {
    if (!logId) return;
    const taskToRevertId = Object.keys(loggedTasks).find(taskId => loggedTasks[taskId].measurementId === logId);

    // Only proceed if we found the associated task ID in our local state
    if (!taskToRevertId) {
      logger.warn("Could not find associated task in local state for undo", { logId });
      toast({ title: "Undo Error", description: "Could not find original task for this log.", variant: "destructive" });
      return;
    }
    
    startTransition(async () => {
      const undoInput = {
          userId: userId,
          notificationId: taskToRevertId, // Now guaranteed to be a string
          logType: logType, 
          details: { 
              measurementId: logId 
          } 
      };
      const result = await undoLogAction(undoInput);
      if (result.success) {
        toast({ title: "Log Undone", description: "The previous log entry has been removed." });
        // No need to check taskToRevertId again here
        setLoggedTasks(prev => {
            const newState = { ...prev };
            delete newState[taskToRevertId];
            return newState;
        });
        await refreshTasks();
      } else {
        toast({ title: "Undo Failed", description: result.error, variant: "destructive" });
      }
    });
  }, [userId, toast, refreshTasks, loggedTasks]);

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
                  true // Mark as skipped
              );
              if (!result.success) {
                  logger.error("Failed to skip notification", { notificationId: task.notificationId, error: result.error });
                  toast({ title: "Error Skipping Task", description: result.error || "Could not update notification status.", variant: "destructive"});
                  refreshTasks();
              } else {
                  logger.info("Notification skipped successfully", { notificationId: task.notificationId });
                  toast({ title: "Task Skipped", description: `${task.title || task.variableName} marked as skipped.` });
                  // Remove the task from the visible list immediately upon successful skip
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

    // If logged, show the logged value and Undo button
    if (loggedState) {
        // Ensure loggedState conforms to the simplified structure
        const loggedValueDisplay = `${loggedState.value} ${task.unitName || ''}`.trim();
        return (
             <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-dashed">
                <p className="text-sm text-muted-foreground italic">
                    Logged: <span className="font-medium text-foreground not-italic">{loggedValueDisplay}</span>
                </p>
                <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUndo(loggedState.measurementId, 'measurement')} 
                    disabled={isPending}
                    className="h-7 px-2 text-xs"
                 >
                    <Undo2 className="mr-1 h-3 w-3" /> Undo
                </Button>
            </div>
        );
    }

    // Always show measurement input controls if not logged
    return (
        <div className="flex gap-2 mt-2 items-end">
            <div className="flex-1 grid gap-1">
                <Label htmlFor={`measure-${task.notificationId}`} className="text-xs">
                    Value {task.unitName ? `(${task.unitName})` : '(Enter Value)'} {/* Indicate value needed */}
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
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking Inbox</CardTitle>
        <CardDescription>Log measurements or skip tasks as needed.</CardDescription>
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
              <div key={task.notificationId} className="rounded-md border p-4">
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
                    {!loggedTasks[task.notificationId] && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-muted-foreground hover:bg-secondary/80"
                            onClick={() => handleSkipTask(task)}
                            disabled={isPending}
                            aria-label="Skip task"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Skip</span>
                        </Button>
                    )}
                  </div>

                  {/* Inline Controls or Logged State */}    
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