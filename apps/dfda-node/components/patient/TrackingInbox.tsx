"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
    getPendingReminderNotificationsAction, 
    completeReminderNotificationAction, 
} from "@/lib/actions/reminder-notifications"
import type { ReminderNotificationDetails } from "@/lib/database.types.custom"
import { logger } from "@/lib/logger"
import { useToast } from "@/components/ui/use-toast"
import { logMeasurementAction } from "@/lib/actions/measurements"
import { undoLogAction } from "@/lib/actions/undoLog"
import { ReminderNotificationCard } from "@/components/reminders/reminder-notification-card"

interface TrackingInboxProps {
  userId: string;
  initialNotifications?: ReminderNotificationDetails[];
}

// Type to store details of recently logged notifications
interface LoggedNotificationState {
    notificationId: string;
    type: 'measurement';
    value: number;
    measurementId: string;
    unitName?: string;
}

export function TrackingInbox({ userId, initialNotifications: initialNotificationsProp }: TrackingInboxProps) {
  const [notifications, setNotifications] = useState<ReminderNotificationDetails[]>(initialNotificationsProp || []);
  const [isLoading, setIsLoading] = useState(!initialNotificationsProp || initialNotificationsProp.length === 0);
  const [loggedItems, setLoggedItems] = useState<LoggedNotificationState[]>([]);
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

  const handleLogMeasurementFromCard = useCallback(async (notificationItemData: ReminderNotificationDetails, value: number): Promise<void> => {
    if (isNaN(value) || value === null || value === undefined) {
        logger.warn("handleLogMeasurementFromCard called with invalid value", { notificationId: notificationItemData.notificationId, value });
        toast({ title: "Invalid Value", description: "Please enter a valid number to log.", variant: "destructive" });
        return;
    }

    let measurementIdFromLog: string | undefined = undefined;
    try {
        const measurementInput = {
            userId: userId,
            userVariableId: notificationItemData.userVariableId,
            globalVariableId: notificationItemData.globalVariableId,
            value: value,
            reminderNotificationId: notificationItemData.notificationId,
            start_at: notificationItemData.dueAt, 
            unit_id: notificationItemData.unitId
        };
        const logResult = await logMeasurementAction(measurementInput);
        if (!logResult.success || !logResult.data?.id) {
            logger.error("Failed to log measurement from inbox", { error: logResult.error, input: measurementInput });
            toast({ title: "Logging Error", description: logResult.error || "Could not save measurement.", variant: "destructive" });
            return;
        }
        measurementIdFromLog = logResult.data.id;
        
        const completeResult = await completeReminderNotificationAction(
            notificationItemData.notificationId,
            userId, 
            false, 
            { measurementId: measurementIdFromLog } 
        );
        if (!completeResult.success) {
            logger.error("Notification completion failed after logging measurement", { 
                notificationId: notificationItemData.notificationId, 
                error: completeResult.error 
            });
        }

        setLoggedItems(prev => [
            ...prev.filter(item => item.notificationId !== notificationItemData.notificationId),
            {
                notificationId: notificationItemData.notificationId,
                type: 'measurement',
                value: value,
                measurementId: measurementIdFromLog!,
                unitName: notificationItemData.unitName 
            }
        ]);
        toast({ title: "Measurement Logged", description: `${notificationItemData.variableName} recorded as ${value} ${notificationItemData.unitName || ''}.`});

    } catch (error) {
        logger.error("Error during measurement log/complete process from inbox", { 
            error, 
            notificationId: notificationItemData.notificationId 
        });
        toast({ title: "System Error", description: "An unexpected error occurred while logging.", variant: "destructive" });
    }
  }, [userId, notifications, toast, setLoggedItems]);

  const handleSkipNotification = useCallback(async (item: ReminderNotificationDetails): Promise<void> => {
    const result = await completeReminderNotificationAction(item.notificationId, userId, true /* skipped */);
    if (!result.success) {
        toast({ title: "Error", description: result.error || "Failed to skip task.", variant: "destructive" });
    } else {
        toast({ title: "Task Skipped", description: `Reminder for ${item.variableName} skipped.` });
        setNotifications(prev => prev.filter(n => n.notificationId !== item.notificationId));
    }
  }, [userId, toast, setNotifications]);

  const handleUndoLoggedNotification = useCallback(async (item: ReminderNotificationDetails): Promise<void> => { 
    const loggedItemToUndo = loggedItems.find(li => li.notificationId === item.notificationId);
    if (!loggedItemToUndo || loggedItemToUndo.type !== 'measurement') {
        logger.warn("Undo called for non-measurement or missing item", { reminderNotificationId: item.notificationId });
        toast({ title: "Cannot Undo", description: "Details for undoing are missing or invalid.", variant: "default" });
      return;
    }
    
    const undoInput = {
        userId: userId,
        notificationId: item.notificationId,
        logType: 'measurement' as const,
        details: { measurementId: loggedItemToUndo.measurementId } 
    };
    const result = await undoLogAction(undoInput);
    if (result.success) {
        setLoggedItems(prev => prev.filter(li => li.notificationId !== item.notificationId));
        toast({ title: "Log Undone", description: "The measurement has been removed." });
        refreshNotifications(); 
    } else {
        toast({ title: "Undo Failed", description: result.error || "Could not undo the log.", variant: "destructive" });
    }
  }, [userId, toast, loggedItems, setLoggedItems, refreshNotifications]);

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
              const loggedItem = loggedItems.find(item => item.notificationId === notification.notificationId);
              
              return (
                <ReminderNotificationCard
                  key={notification.notificationId}
                  reminderNotification={notification}
                  userTimezone={userTimezone}
                  onLogMeasurement={handleLogMeasurementFromCard}
                  onSkip={handleSkipNotification}
                  onUndoLog={loggedItem ? handleUndoLoggedNotification : undefined}
                  loggedData={loggedItem ? { value: loggedItem.value, unitName: loggedItem.unitName || notification.unitName } : undefined}
                  isProcessing={isLoading}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 