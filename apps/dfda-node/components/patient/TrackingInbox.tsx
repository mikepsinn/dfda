"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
    getPendingReminderNotificationsAction, 
    completeReminderNotificationAction, 
    type PendingNotificationTask as PendingReminderNotification 
} from "@/lib/actions/reminder-schedules"
import { logger } from "@/lib/logger"
import { useToast } from "@/components/ui/use-toast"
import { logMeasurementAction } from "@/lib/actions/measurements"
import { undoLogAction } from "@/lib/actions/undoLog"
import { MeasurementNotificationItem } from '@/components/shared/measurement-notification-item'

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
  const [loggedNotifications, setLoggedNotifications] = useState<Record<string, LoggedNotificationState>>({});
  const [isPending, startTransition] = useTransition();
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

  // Core functions for handling measurements
  const handleLogMeasurement = useCallback((notification: PendingReminderNotification, value: number) => {
    // const valueStr = measurementValues[notification.notificationId] || ""; // No longer needed
    // const numericValue = parseFloat(valueStr); // No longer needed

    // Basic check for valid number before proceeding
    if (isNaN(value) || value === null || value === undefined) {
        logger.warn("handleLogMeasurement called with invalid value", { notificationId: notification.notificationId, value });
        // Toast handled by ReminderNotificationCard
        return;
    }

    startTransition(async () => {
      let measurementId: string | undefined = undefined;
      try {
        const measurementInput = {
            userId: userId,
            userVariableId: notification.userVariableId,
            globalVariableId: notification.globalVariableId,
            value: value, // Use the passed value directly
            reminderNotificationId: notification.notificationId
        };
        const logResult = await logMeasurementAction(measurementInput);
        if (!logResult.success || !logResult.data?.id) {
            logger.error("Failed to log measurement", { error: logResult.error, input: measurementInput });
            // Toast handled by ReminderNotificationCard
            return;
        }
        measurementId = logResult.data.id;
        
        const completeResult = await completeReminderNotificationAction(
            notification.notificationId,
            userId, 
            false,
            { measurementId } // Log details now only contain measurementId
        );
        if (!completeResult.success) {
            logger.error("Notification completion failed after logging measurement", { 
                notificationId: notification.notificationId, 
                error: completeResult.error 
            });
            // Note: We still recorded the log, so update local state
        }

        // Update local state regardless of completion success
        setLoggedNotifications(prev => ({
            ...prev,
            [notification.notificationId]: {
                type: 'measurement',
                value: value, // Store the passed value
                measurementId: measurementId!, 
            }
        }));
        // We don't need to clear measurementValues here as it wasn't used for this log
        // setMeasurementValues(prev => ({ ...prev, [notification.notificationId]: '' })); 

      } catch (error) {
        logger.error("Error during measurement log/complete process", { 
            error, 
            notificationId: notification.notificationId 
        });
      }
    });
  }, [userId, startTransition]); // Ensure all necessary dependencies are included

  const handleUndo = useCallback(async (logId: string | undefined, logType: 'measurement') => {
    if (!logId) return;
    const notificationToRevertId = Object.keys(loggedNotifications).find(notificationId => loggedNotifications[notificationId].measurementId === logId);

    if (!notificationToRevertId) {
      logger.warn("Could not find associated notification in local state for undo", { logId });
      // Toast handled by ReminderNotificationCard
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
        // Update local state ONLY - make the input controls reappear
        setLoggedNotifications(prev => {
            const newState = { ...prev };
            delete newState[notificationToRevertId];
            return newState;
        });
        // Do NOT refresh immediately - let the card reappear in its pending state
        // await refreshNotifications(); 
      } // Error toast handled by card
    });
  }, [userId, loggedNotifications]); // Removed refreshNotifications dependency

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
              return (
                <MeasurementNotificationItem
                  key={notification.notificationId}
                  item={{
                    id: notification.notificationId,
                    globalVariableId: notification.globalVariableId,
                    userVariableId: notification.userVariableId,
                    variableCategoryId: notification.variableCategory,
                    name: notification.variableName,
                    triggerAtUtc: notification.dueAt,
                    value: loggedState?.value ?? null,
                    unit: notification.unitName || notification.unitId,
                    unitId: notification.unitId,
                    unitName: notification.unitName,
                    status: loggedState ? 'completed' : 'pending',
                    default_value: null,
                    reminderScheduleId: notification.scheduleId,
                    emoji: null,
                  }}
                  userTimezone={userTimezone}
                  isLogged={!!loggedState}
                  isPending={isPending}
                  onUndo={logId => handleUndo(logId, 'measurement')}
                  onLogMeasurement={(_, value) => handleLogMeasurement(notification, value)}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 