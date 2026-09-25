"use client"

import React, { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { logger } from "@/lib/logger"
import { UniversalTimeline } from "@/components/universal-timeline"
import { MeasurementAddDialog } from "@/components/patient/MeasurementAddDialog"
import type { MeasurementCardData } from "@/components/measurement-card"
import { updateMeasurementAction, logMeasurementAction } from "@/lib/actions/measurements"
import type { ReminderNotificationDetails } from "@/lib/database.types.custom"
import type { UserVariableWithDetails } from "@/lib/actions/user-variables"

interface UserVariableDetailClientTimelineProps {
  userId: string
  userVariable: UserVariableWithDetails;
  initialMeasurements: MeasurementCardData[];
  initialTimelineNotifications: ReminderNotificationDetails[];
}

export default function UserVariableDetailClientTimeline({
  userId,
  userVariable,
  initialMeasurements,
  initialTimelineNotifications,
}: UserVariableDetailClientTimelineProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const measurementsForTimeline = useMemo(() => {
    return initialMeasurements.map(m => ({ ...m, name: userVariable.global_variables?.name || 'Measurement' }));
  }, [initialMeasurements, userVariable.global_variables?.name]);

  const notificationsForTimeline = useMemo(() => {
    return initialTimelineNotifications;
  }, [initialTimelineNotifications]);

  const handleAddMeasurementCallback = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const handleDialogSubmit = useCallback(async ({ value, unit, notes }: { value: number; unit: string; notes?: string }) => {
    if (!userVariable.global_variable_id) {
        toast({ title: 'Error', description: 'Variable configuration is missing.', variant: 'destructive' });
        return;
    }
    try {
        const result = await logMeasurementAction({ 
            userId: userId,
            globalVariableId: userVariable.global_variable_id, 
            value, 
            unitId: unit,
            notes 
        });
        if (!result.success) {
            toast({ title: 'Error', description: result.error || 'Failed to add measurement.', variant: 'destructive' });
            return;
        }
        setDialogOpen(false);
        router.refresh();
        toast({ title: 'Measurement Added', description: `${userVariable.global_variables?.name || 'Variable'} measurement logged successfully.`, variant: 'default' });
    } catch (e: any) {
        toast({ title: 'Error', description: e?.message || 'Failed to add measurement.', variant: 'destructive' });
        logger.error("Error submitting measurement from UserVariableDetailClientTimeline", { error: e, userVariableId: userVariable.id });
    }
  }, [userId, userVariable, toast, router])

  const handleEditMeasurementCallback = useCallback(async (measurementToUpdate: MeasurementCardData, newValue: number) => {
    try {
        const result = await updateMeasurementAction({
            measurementId: measurementToUpdate.id, 
            userId: userId,
            value: newValue, 
            unitId: measurementToUpdate.unitId,
            notes: measurementToUpdate.notes ?? undefined
        });
        if (!result.success) {
            toast({ title: 'Error', description: result.error || 'Failed to update measurement.', variant: 'destructive' });
        } else {
            toast({ title: 'Measurement Updated', description: 'Measurement details saved.', variant: 'default' });
            router.refresh();
        }
    } catch (e: any) {
        toast({ title: 'Error', description: e?.message || 'Failed to update measurement.', variant: 'destructive' });
        logger.error("Error editing measurement from UserVariableDetailClientTimeline", { error: e, measurementId: measurementToUpdate.id });
    }
  }, [userId, toast, router])

  const handleLogNotification = async (notification: ReminderNotificationDetails, value: number) => {
    logger.info('Log notification from UserVariableDetailClientTimeline:', { notificationId: notification.notificationId, value });
    toast({title: "Log Action (Not Implemented)", description: "Logging reminder notifications from this specific timeline view is not yet fully implemented.", variant: "default"});
    // TODO: If this view should actually log notifications, call the appropriate action here, e.g.:
    // await createMeasurementAndCompleteNotificationAction({ userId, globalVariableId: notification.globalVariableId, ... });
  };

  const handleSkipNotificationTimeline = async (notification: ReminderNotificationDetails) => {
    logger.info('Skip notification from UserVariableDetailClientTimeline:', { notificationId: notification.notificationId });
    toast({title: "Skip Action (Not Implemented)", description: "Skipping reminders from this view is not yet implemented.", variant: "default"});
    // TODO: await completeReminderNotificationAction(notification.notificationId, userId, true);
  };

  const handleUndoNotificationTimeline = async (notification: ReminderNotificationDetails) => {
    logger.info('Undo notification from UserVariableDetailClientTimeline:', { notificationId: notification.notificationId });
    toast({title: "Undo Action (Not Implemented)", description: "Undo from this view is not yet implemented.", variant: "default"});
    // TODO: await undoNotificationAction({ notificationId: notification.notificationId, userId });
  };

  return (
    <div className="space-y-6">
        <UniversalTimeline
            rawMeasurements={measurementsForTimeline}
            rawNotifications={notificationsForTimeline}
            userTimezone={userTimezone}
            onAddMeasurement={handleAddMeasurementCallback}
            onUpdateMeasurement={handleEditMeasurementCallback}
            onLogNotificationMeasurement={handleLogNotification}
            onSkipNotification={handleSkipNotificationTimeline}
            onUndoNotificationLog={handleUndoNotificationTimeline}
            showFilters={false}
            showDateNavigation={true}
            showAddButtons={true}
            emptyState={<p>No measurements or relevant notifications found for this variable on this day.</p>}
        />
        <MeasurementAddDialog
            isOpen={dialogOpen}
            onClose={() => setDialogOpen(false)}
            userVariables={userVariable ? [userVariable] : []}
            onSubmit={handleDialogSubmit}
        />
    </div>
  )
}
