"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
    getPendingReminderNotificationsAction, 
    completeReminderNotificationAction, 
    type FetchedPendingNotification
} from "@/lib/actions/reminder-schedules"
import { logger } from "@/lib/logger"
import { useToast } from "@/components/ui/use-toast"
import { logMeasurementAction } from "@/lib/actions/measurements"
import { undoLogAction } from "@/lib/actions/undoLog"
import { ReminderNotificationCard, type ReminderNotificationCardData } from "@/components/reminders/reminder-notification-card"

interface TrackingInboxProps {
  userId: string;
  initialNotifications?: FetchedPendingNotification[];
}

// Type to store details of recently logged notifications (simplified for measurements only)
interface LoggedNotificationState {
    type: 'measurement'; // Only measurement type for now
    value: number;
    measurementId: string; // Store measurement ID for undo
}

export function TrackingInbox({ userId, initialNotifications: initialNotificationsProp }: TrackingInboxProps) {
  const [notifications, setNotifications] = useState<FetchedPendingNotification[]>(initialNotificationsProp || []);
  const [isLoading, setIsLoading] = useState(!initialNotificationsProp || initialNotificationsProp.length === 0); // True only if no initial notifications
  const [loggedNotifications, setLoggedNotifications] = useState<Record<string, LoggedNotificationState>>({});
  const [, startTransition] = useTransition();
  const { toast } = useToast();
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedNotifications = await getPendingReminderNotificationsAction(userId);
      setNotifications(fetchedNotifications);
    } catch (error) {
      logger.error("Failed to refresh reminder notifications", { userId, error });
      toast({ title: "Error", description: "Could not refresh tasks.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    // Only fetch notifications if they weren't provided initially
    if (!initialNotificationsProp || initialNotificationsProp.length === 0) {
        refreshNotifications();
    }
    // Dependencies: userId might change, initialNotificationsProp might change (though unlikely after mount),
    // and refreshNotifications is called conditionally.
  }, [userId, initialNotificationsProp, refreshNotifications]);

  const handleLogMeasurementFromCard = useCallback((notificationItemData: ReminderNotificationCardData, value: number) => {
    // Find the original PendingReminderNotification to get all necessary IDs
    const originalNotification = notifications.find(n => n.notificationId === notificationItemData.id);
    if (!originalNotification) {
        logger.error("TrackingInbox: Original notification not found for logging.", { id: notificationItemData.id });
        toast({ title: "Error", description: "Could not log measurement. Task details missing.", variant: "destructive" });
        return;
    }

    if (isNaN(value) || value === null || value === undefined) {
        logger.warn("handleLogMeasurementFromCard called with invalid value", { notificationId: originalNotification.notificationId, value });
        toast({ title: "Invalid Value", description: "Please enter a valid number to log.", variant: "destructive" });
        return;
    }

    startTransition(async () => {
      let measurementIdFromLog: string | undefined = undefined;
      try {
        const measurementInput = {
            userId: userId,
            userVariableId: originalNotification.userVariableId,
            globalVariableId: originalNotification.globalVariableId,
            value: value,
            reminderNotificationId: originalNotification.notificationId,
            start_at: originalNotification.dueAt, // Measurements are logged at the reminder due time
            unit_id: originalNotification.unitId
        };
        const logResult = await logMeasurementAction(measurementInput);
        if (!logResult.success || !logResult.data?.id) {
            logger.error("Failed to log measurement from inbox", { error: logResult.error, input: measurementInput });
            toast({ title: "Logging Error", description: logResult.error || "Could not save measurement.", variant: "destructive" });
            return;
        }
        measurementIdFromLog = logResult.data.id;
        
        const completeResult = await completeReminderNotificationAction(
            originalNotification.notificationId,
            userId, 
            false, // not skipped
            { measurementId: measurementIdFromLog } 
        );
        if (!completeResult.success) {
            logger.error("Notification completion failed after logging measurement", { 
                notificationId: originalNotification.notificationId, 
                error: completeResult.error 
            });
            // Even if completion fails, the measurement was logged, so UI should reflect that.
        }

        setLoggedNotifications(prev => ({
            ...prev,
            [originalNotification.notificationId]: {
                type: 'measurement',
                value: value,
                measurementId: measurementIdFromLog!,
            }
        }));
        toast({ title: "Measurement Logged", description: `${originalNotification.variableName} recorded as ${value}.`});

      } catch (error) {
        logger.error("Error during measurement log/complete process from inbox", { 
            error, 
            notificationId: originalNotification.notificationId 
        });
        toast({ title: "System Error", description: "An unexpected error occurred while logging.", variant: "destructive" });
      }
    });
  }, [userId, startTransition, notifications, toast]);

  const handleSkipNotification = useCallback(async (item: ReminderNotificationCardData) => {
    startTransition(async () => {
        const result = await completeReminderNotificationAction(item.id, userId, true /* skipped */);
        if (!result.success) {
            toast({ title: "Error", description: result.error || "Failed to skip task.", variant: "destructive" });
        } else {
            toast({ title: "Task Skipped", description: `Reminder for ${item.variableName} skipped.` });
            // Optimistically remove the skipped item from the list
            setNotifications(prev => prev.filter(n => n.notificationId !== item.id));
        }
    });
  }, [userId, startTransition, toast]);

  const handleUndoLoggedNotification = useCallback(async (reminderNotificationId: string, measurementId?: string) => {
    if (!measurementId) {
        logger.warn("Undo called without measurementId for notification", { reminderNotificationId });
        toast({ title: "Cannot Undo", description: "Details for undoing are missing.", variant: "default" });
      return;
    }
    
    startTransition(async () => {
      const undoInput = {
          userId: userId,
          notificationId: reminderNotificationId,
          logType: 'measurement' as const, // Ensure logType is correctly typed
          details: { measurementId } 
      };
      const result = await undoLogAction(undoInput);
      if (result.success) {
        setLoggedNotifications(prev => {
            const newState = { ...prev };
            delete newState[reminderNotificationId];
            return newState;
        });
        toast({ title: "Log Undone", description: "The measurement has been removed." });
      } else {
        toast({ title: "Undo Failed", description: result.error || "Could not undo the log.", variant: "destructive" });
      }
    });
  }, [userId, startTransition, toast]);

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
            {notifications.map((notification) => {
              const loggedState = loggedNotifications[notification.notificationId];
              
              const cardDataItem: ReminderNotificationCardData = {
                id: notification.notificationId,
                reminderScheduleId: notification.scheduleId,
                triggerAtUtc: notification.dueAt,
                status: notification.status && ['pending', 'completed', 'skipped', 'error'].includes(notification.status) 
                        ? notification.status 
                        : (loggedState ? 'completed' : 'pending'),
                variableName: notification.variableName,
                variableCategoryId: notification.variableCategory as ReminderNotificationCardData['variableCategoryId'],
                unitId: notification.unitId || 'fallback_id',
                unitName: notification.unitName || 'fallback_name',
                details: notification.message || undefined,
                isEditable: !loggedState,
                defaultValue: notification.defaultValue,
                emoji: notification.emoji,
                currentValue: loggedState?.value,
              };

              return (
                <ReminderNotificationCard
                  key={notification.notificationId}
                  reminderNotification={cardDataItem}
                  userTimezone={userTimezone}
                  onLogMeasurement={handleLogMeasurementFromCard}
                  onSkip={handleSkipNotification}
                  onUndo={loggedState ? () => handleUndoLoggedNotification(notification.notificationId, loggedState.measurementId) : undefined}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 