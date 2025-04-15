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
    type PendingNotificationTask as PendingReminderNotification 
} from "@/app/actions/reminder-schedules"
import { logger } from "@/lib/logger"
import { formatDistanceToNow } from 'date-fns'
import { useToast } from "@/components/ui/use-toast"
import { logMeasurementAction } from "@/app/actions/measurements"
import { undoLogAction } from "@/app/actions/undoLog"

interface TrackingInboxProps {
  userId: string;
  initialNotifications?: PendingReminderNotification[];
}

// Type to store details of recently logged notifications (simplified for measurements only)
interface LoggedNotificationState {
    type: 'measurement'; // Only measurement type for now
    value: number;
    measurementId: string; // Store measurement ID for undo
}

export function TrackingInbox({ userId, initialNotifications: initialNotificationsProp }: TrackingInboxProps) {
  const [notifications, setNotifications] = useState<PendingReminderNotification[]>(initialNotificationsProp || []);
  const [isLoading, setIsLoading] = useState(!initialNotificationsProp || initialNotificationsProp.length === 0); // True only if no initial notifications
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [loggedNotifications, setLoggedNotifications] = useState<Record<string, LoggedNotificationState>>({});
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedNotifications = await getPendingReminderNotificationsAction(userId);
      setNotifications(fetchedNotifications);
      
      const initialMeasurementValues: Record<string, string> = {};
      fetchedNotifications.forEach(notification => {
        if (!(notification.notificationId in loggedNotifications)) { 
             initialMeasurementValues[notification.notificationId] = ""; 
        }
      });
      setMeasurementValues(initialMeasurementValues);
    } catch (error) {
      logger.error("Failed to refresh reminder notifications", { userId, error });
      toast({ title: "Error", description: "Could not refresh tasks.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast, loggedNotifications]);

  useEffect(() => {
    // Only fetch notifications if they weren't provided initially
    if (!initialNotificationsProp || initialNotificationsProp.length === 0) {
        refreshNotifications();
    } else {
        // If initial notifications *were* provided, initialize measurementValues state.
        // isLoading is already false from useState.
        const initialMeasurementValues: Record<string, string> = {};
        initialNotificationsProp.forEach(notification => {
            initialMeasurementValues[notification.notificationId] = "";
        });
        setMeasurementValues(initialMeasurementValues);
    }
    // Dependencies: userId might change, initialNotificationsProp might change (though unlikely after mount),
    // and refreshNotifications is called conditionally.
  }, [userId, initialNotificationsProp, refreshNotifications]);

  const handleLogMeasurement = (notification: PendingReminderNotification) => {
      const valueStr = measurementValues[notification.notificationId] || "";
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
                userVariableId: notification.userVariableId,
                globalVariableId: notification.globalVariableId,
                value: numericValue,
                reminderNotificationId: notification.notificationId
            };
            const logResult = await logMeasurementAction(measurementInput);
            if (!logResult.success || !logResult.data?.id) {
                logger.error("Failed to log measurement", { error: logResult.error, input: measurementInput });
                toast({ title: "Error Logging Measurement", description: logResult.error || "Could not save measurement.", variant: "destructive"});
                return;
            }
            measurementId = logResult.data.id;
            toast({ title: "Measurement Logged", description: `${notification.variableName}: ${numericValue} ${notification.unitName || ''}`.trim()});
            
            const completeResult = await completeReminderNotificationAction(
                notification.notificationId,
                userId, 
                false,
                { measurementId } // Log details now only contain measurementId
            );
            if (!completeResult.success) {
                logger.error("Notification completion failed after logging measurement", { notificationId: notification.notificationId, error: completeResult.error });
                toast({ title: "Log Saved, Notification Update Failed", description: completeResult.error || "Could not update reminder status.", variant: "destructive"});
                // Note: We still recorded the log, so update local state
            }

            // Update local state regardless of completion success
            setLoggedNotifications(prev => ({
                ...prev,
                [notification.notificationId]: {
                    type: 'measurement',
                    value: numericValue,
                    measurementId: measurementId!, // Assert non-null as we checked logResult.success
                }
            }));
            setMeasurementValues(prev => ({ ...prev, [notification.notificationId]: '' }));

          } catch (error) {
             logger.error("Error during measurement log/complete process", { error, notificationId: notification.notificationId });
             toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"});
          }
      });
  };

  const handleUndo = useCallback(async (logId: string | undefined, logType: 'measurement') => {
    if (!logId) return;
    const notificationToRevertId = Object.keys(loggedNotifications).find(notificationId => loggedNotifications[notificationId].measurementId === logId);

    // Only proceed if we found the associated notification ID in our local state
    if (!notificationToRevertId) {
      logger.warn("Could not find associated notification in local state for undo", { logId });
      toast({ title: "Undo Error", description: "Could not find original notification for this log.", variant: "destructive" });
      return;
    }
    
    startTransition(async () => {
      const undoInput = {
          userId: userId,
          notificationId: notificationToRevertId, // Now guaranteed to be a string
          logType: logType, 
          details: { 
              measurementId: logId 
          } 
      };
      const result = await undoLogAction(undoInput);
      if (result.success) {
        toast({ title: "Log Undone", description: "The previous log entry has been removed." });
        // No need to check notificationToRevertId again here
        setLoggedNotifications(prev => {
            const newState = { ...prev };
            delete newState[notificationToRevertId];
            return newState;
        });
        await refreshNotifications();
      } else {
        toast({ title: "Undo Failed", description: result.error, variant: "destructive" });
      }
    });
  }, [userId, toast, refreshNotifications, loggedNotifications]);

  const handleSkipNotification = (notification: PendingReminderNotification) => {
      if (loggedNotifications[notification.notificationId]) {
          setLoggedNotifications(prev => {
              const newState = { ...prev };
              delete newState[notification.notificationId];
              return newState;
          });
      }
      
      startTransition(async () => {
          try {
              const result = await completeReminderNotificationAction(
                  notification.notificationId,
                  userId, 
                  true // Mark as skipped
              );
              if (!result.success) {
                  logger.error("Failed to skip notification", { notificationId: notification.notificationId, error: result.error });
                  toast({ title: "Error Skipping Task", description: result.error || "Could not update notification status.", variant: "destructive"});
                  refreshNotifications();
              } else {
                  logger.info("Notification skipped successfully", { notificationId: notification.notificationId });
                  toast({ title: "Task Skipped", description: `${notification.title || notification.variableName} marked as skipped.` });
                  // Remove the notification from the visible list immediately upon successful skip
                  setNotifications(prev => prev.filter(n => n.notificationId !== notification.notificationId));
              }
          } catch (error) {
              logger.error("Error skipping notification", { error, notificationId: notification.notificationId });
              toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"});
          }
      });
  };

  const renderNotificationControls = (notification: PendingReminderNotification) => {
    const loggedState = loggedNotifications[notification.notificationId];

    // If logged, show the logged value and Undo button
    if (loggedState) {
        // Ensure loggedState conforms to the simplified structure
        const loggedValueDisplay = `${loggedState.value} ${notification.unitName || ''}`.trim();
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
                <Label htmlFor={`measure-${notification.notificationId}`} className="text-xs">
                    Value {notification.unitName ? `(${notification.unitName})` : '(Enter Value)'} {/* Indicate value needed */}
                </Label>
                <Input 
                    id={`measure-${notification.notificationId}`}
                    type="number" 
                    step="any"
                    value={measurementValues[notification.notificationId] || ''}
                    onChange={(e) => setMeasurementValues(prev => ({ ...prev, [notification.notificationId]: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="Enter value..."
                    disabled={isPending}
                />
            </div>
            <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleLogMeasurement(notification)}
                disabled={isPending || !measurementValues[notification.notificationId]}
                className="h-8"
            >
               Log
            </Button>
        </div>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tracking Inbox</CardTitle>
          <CardDescription>Loading your pending reminder notifications...</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking Inbox</CardTitle>
        <CardDescription>
          You have {notifications.length} pending reminder notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading notifications...</p>} 
        {!isLoading && notifications.length === 0 && (
          <div className="text-center text-muted-foreground">
            <p className="mb-4">No pending tracking notifications.</p>
            <Link href="/patient/reminders" passHref>
              <Button variant="secondary">Manage Reminders</Button>
            </Link>
          </div>
        )}
        
        {notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.notificationId} className="rounded-md border p-4">
                  {/* Task Info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{notification.title || notification.variableName}</p>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDistanceToNow(new Date(notification.dueAt), { addSuffix: true })}
                        {' '}({new Date(notification.dueAt).toLocaleTimeString([], { timeStyle: 'short' })})
                      </p>
                    </div>
                    {/* Show Skip only if not already logged */} 
                    {!loggedNotifications[notification.notificationId] && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-muted-foreground hover:bg-secondary/80"
                            onClick={() => handleSkipNotification(notification)}
                            disabled={isPending}
                            aria-label="Skip notification"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Skip</span>
                        </Button>
                    )}
                  </div>

                  {/* Inline Controls or Logged State */}    
                  <div className="mt-2">
                      {renderNotificationControls(notification)}
                  </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 