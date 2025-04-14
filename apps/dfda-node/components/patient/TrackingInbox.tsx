"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, ClipboardPenLine } from "lucide-react"
import { 
    getPendingReminderTasksAction, 
    completeReminderTaskAction, 
    type PendingReminderTask 
} from "@/app/actions/reminder-schedules"
import { logger } from "@/lib/logger"
import { formatDistanceToNow } from 'date-fns'

// Placeholder imports for dialogs/logging components
// import { TreatmentRatingDialog } from '@/app/(protected)/patient/treatments/components/treatment-rating-dialog'
// import { ConditionSeverityDialog } from './ConditionSeverityDialog' // Needs to be created
// import { TreatmentAdherenceDialog } from './TreatmentAdherenceDialog' // Needs to be created

interface TrackingInboxProps {
  userId: string;
  initialTasks?: PendingReminderTask[]; // Allow passing initial tasks from server component
}

export function TrackingInbox({ userId, initialTasks = [] }: TrackingInboxProps) {
  const [tasks, setTasks] = useState<PendingReminderTask[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);

  // Function to refresh tasks - Wrap in useCallback
  const refreshTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTasks = await getPendingReminderTasksAction(userId);
      setTasks(fetchedTasks);
    } catch (error) {
      logger.error("Failed to refresh tracking tasks", { userId, error });
      // TODO: Show toast error
    } finally {
      setIsLoading(false);
    }
  }, [userId]); // Add userId as dependency for useCallback

  // Initial load if tasks weren't provided
  useEffect(() => {
    if (initialTasks.length === 0) {
       refreshTasks();
    }
  }, [initialTasks.length, refreshTasks]);

  const handleCompleteTask = async (task: PendingReminderTask, skipped: boolean, logData?: any) => {
     try {
       // Optimistically remove task from UI
       setTasks(prev => prev.filter(t => t.scheduleId !== task.scheduleId));
       
       const result = await completeReminderTaskAction(task.scheduleId, userId, skipped, logData);
       if (!result.success) {
         logger.error("Failed to complete task via action", { scheduleId: task.scheduleId, userId, error: result.error });
         // TODO: Show toast error
         // Re-add task to list if completion failed?
         refreshTasks(); // Refresh to get accurate state
       } else {
         logger.info("Task completed successfully", { scheduleId: task.scheduleId, userId, skipped });
         // Optionally trigger next data fetch if needed
       }
     } catch (error) {
        logger.error("Error completing task", { scheduleId: task.scheduleId, userId, error });
        refreshTasks(); // Refresh to get accurate state
     }
  };

  const handleLogAction = (task: PendingReminderTask) => {
     logger.info("Log action clicked for task", { scheduleId: task.scheduleId });
     // Here you would open the appropriate dialog based on task type/title/message
     // Example:
     // if (task.title?.includes('Severity')) openSeverityDialog(task);
     // else if (task.title?.includes('Adherence')) openAdherenceDialog(task);
     alert(`Placeholder: Open logging dialog for: ${task.title || task.variableName}`);
     // For now, just mark as complete after alert
     handleCompleteTask(task, false, { logged: true }); 
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking Inbox</CardTitle>
        <CardDescription>Your pending tracking tasks based on your reminders.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && tasks.length === 0 && <p>Loading tasks...</p>}
        {!isLoading && tasks.length === 0 && (
          <div className="text-center text-muted-foreground">
            <p className="mb-4">No pending tracking tasks.</p>
            <Link href="/patient/onboarding" passHref>
              <Button variant="secondary">Setup Reminders</Button>
            </Link>
          </div>
        )}
        
        {tasks.length > 0 && (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.scheduleId} className="flex items-center justify-between rounded-md border p-4 gap-4">
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
                <div className="flex gap-2 flex-shrink-0">
                  {/* Placeholder: Determine specific action based on task type */}
                  {/* Example: Show specific Log button */} 
                  <Button size="sm" onClick={() => handleLogAction(task)}>
                    <ClipboardPenLine className="mr-1 h-4 w-4" /> Log Now
                  </Button>
                   {/* Example: Show Skip button only? */}
                  <Button variant="outline" size="sm" onClick={() => handleCompleteTask(task, true)}>
                     <Clock className="mr-1 h-4 w-4" /> Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Placeholder for Dialogs - Triggered by setLoggingTask */}
        {/* {loggingTask && taskType === 'severity' && (
            <ConditionSeverityDialog 
               task={loggingTask} 
               onClose={() => setLoggingTask(null)} 
               onComplete={(data) => handleCompleteTask(loggingTask, false, data)} 
            />
        )} */} 

      </CardContent>
    </Card>
  )
} 