'use client'

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HeartPulse, Pill } from "lucide-react";
import { logger } from "@/lib/logger";
import { ImageAnalysisCapture } from '@/components/shared/ImageAnalysisCapture';
import { TrackingInbox } from "@/components/patient/TrackingInbox";
import { UniversalTimeline, type FilterableVariableCategoryId } from '@/components/universal-timeline';
import { MeasurementAddDialog } from './MeasurementAddDialog';
import type { MeasurementCardData } from "@/components/measurement-card";

// Import Server Actions needed for callbacks
import { updateMeasurementAction, logMeasurementAction } from '@/lib/actions/measurements';
import { 
    createMeasurementAndCompleteNotificationAction,
    completeReminderNotificationAction,
    undoNotificationAction
} from '@/lib/actions/reminder-notifications';

// Import Types
import type { User } from '@supabase/supabase-js';
import type { Tables } from '@/lib/database.types';
import type { ReminderNotificationDetails } from "@/lib/database.types.custom";
import type { UserVariableWithDetails } from "@/lib/actions/user-variables";

// Define types using the Tables helper
type PatientConditionRow = Tables<'patient_conditions_view'>;

interface PatientDashboardDisplayProps {
  initialUser: User;
  initialPendingNotifications: ReminderNotificationDetails[];
  initialMeasurements: MeasurementCardData[];
  initialTimelineNotifications: ReminderNotificationDetails[];
  initialUserVariables: UserVariableWithDetails[];
  initialConditions: PatientConditionRow[]; // Or any[] for now if type is complex
  initialDateForTimeline: string; // Add new prop
}

export default function PatientDashboardDisplay({
  initialUser,
  initialPendingNotifications,
  initialMeasurements,
  initialTimelineNotifications,
  initialUserVariables,
  initialConditions, // Destructure the new prop
  initialDateForTimeline, // Destructure the new prop
}: PatientDashboardDisplayProps) {

  const router = useRouter();
  const { toast } = useToast();

  // State for components originally in PatientDashboardClient
  const user = initialUser; // Use prop directly
  const notifications = initialPendingNotifications; // Use prop directly
  // TODO: Use initialConditions to display patient conditions information
  if (process.env.NODE_ENV === 'development') {
    logger.info('PatientDashboardDisplay: initialConditions received', { count: initialConditions?.length });
  }

  // State for Dialog (originally in PatientTimelineClient)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogCategory, setDialogCategory] = useState<FilterableVariableCategoryId | null>(null);

  // Data for Timeline (from new props)
  const userVariables = initialUserVariables;

  // Directly use the new props for UniversalTimeline
  // The mapping is no longer needed as initialMeasurements is already MeasurementCardData[]
  const measurementsForTimeline = initialMeasurements; // DIRECTLY use the prop

  // Extract user timezone, default to UTC if not available
  const userTimezone = initialUser.user_metadata?.profile?.timezone || 'UTC';

  // Filtered variables for the dialog
  const filteredVariables = dialogCategory && dialogCategory !== 'all'
      ? userVariables.filter((v) => v.global_variables?.variable_category_id === dialogCategory)
      : userVariables;

  // --- Callbacks (Merged from PatientTimelineClient) ---

  const handleAddMeasurementCallback = useCallback((categoryId: FilterableVariableCategoryId) => {
      setDialogCategory(categoryId);
      setDialogOpen(true);
  }, []);

  const handleDialogSubmit = useCallback(async ({ userVariableId, value, unit, notes }: { userVariableId: string; value: number; unit: string; notes?: string }) => {
    const userVar = userVariables.find(v => v.id === userVariableId);
    if (!userVar || !userVar.global_variable_id) {
        toast({ title: 'Error', description: 'Invalid variable selection.', variant: 'destructive' });
        return;
    }
    try {
        const result = await logMeasurementAction({ userId: user.id, globalVariableId: userVar.global_variable_id, value, unitId: unit, notes });
        if (!result.success) {
            toast({ title: 'Error', description: result.error || 'Failed to add measurement.', variant: 'destructive' });
            return;
        }
        setDialogOpen(false);
        setDialogCategory(null);
        router.refresh(); // Re-enable refresh
        toast({ title: 'Measurement Added', description: `${userVar.global_variables?.name || 'Variable'} measurement logged successfully.`, variant: 'default' });
    } catch (e: any) {
        toast({ title: 'Error', description: e?.message || 'Failed to add measurement.', variant: 'destructive' });
    }
  }, [user.id, userVariables, toast, router]);

  const handleEditMeasurementCallback = useCallback(async (measurementToUpdate: MeasurementCardData, newValue: number) => {
      logger.info('DashboardDisplay: handleEditMeasurementCallback called for MeasurementCardData', { 
        measurementId: measurementToUpdate.id, 
        newValue, 
        unitId: measurementToUpdate.unitId 
      });
      try {
          const result = await updateMeasurementAction({
            measurementId: measurementToUpdate.id, 
            userId: user.id, 
            value: newValue, 
            unitId: measurementToUpdate.unitId, // Use unitId from MeasurementCardData
            notes: measurementToUpdate.notes ?? undefined // Use existing notes
          });
          if (!result.success) {
              toast({ title: 'Error', description: result.error || 'Failed to update measurement.', variant: 'destructive' });
          } else {
              toast({ title: 'Measurement Updated', description: 'Measurement details saved.', variant: 'default' });
              router.refresh();
          }
      } catch (e: any) {
          toast({ title: 'Error', description: e?.message || 'Failed to update measurement.', variant: 'destructive' });
      }
  }, [user.id, toast, router]);

  // --- Callbacks for Reminder Notifications ---
  const handleLogNotificationMeasurement = useCallback(async (notification: ReminderNotificationDetails, value: number) => {
    logger.info('PatientDashboardDisplay: handleLogNotificationMeasurement called', { notificationId: notification.notificationId, value });
    try {
      // Call the new orchestrated action
      const result = await createMeasurementAndCompleteNotificationAction({
        notificationId: notification.notificationId,
        scheduleId: notification.scheduleId,
        userId: user.id,
        value,
        unitId: notification.unitId,
        globalVariableId: notification.globalVariableId, // Pass globalVariableId
        // notes: undefined, // Add if you have a way to capture notes from the card
      });

      if (result.success) {
        toast({ title: 'Logged', description: `${notification.variableName} recorded as ${value}.`, variant: 'default' });
        router.refresh();
      } else {
        toast({ title: 'Error', description: result.error || `Failed to log ${notification.variableName}.`, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || `An unexpected error occurred while logging ${notification.variableName}.`, variant: 'destructive' });
      logger.error('Failed to log notification measurement', { error: e, notificationId: notification.notificationId });
    }
  }, [user.id, toast, router]);

  const handleSkipNotification = useCallback(async (notification: ReminderNotificationDetails) => {
    logger.info('PatientDashboardDisplay: handleSkipNotification called', { notificationId: notification.notificationId });
    try {
      // Call the existing completeReminderNotificationAction for skipping
      const result = await completeReminderNotificationAction(
        notification.notificationId,
        user.id,
        true // skipped = true
        // No logDetails needed for a simple skip
      );
      if (result.success) {
        toast({ title: 'Skipped', description: `${notification.variableName} marked as skipped.`, variant: 'default' });
        router.refresh();
      } else {
        toast({ title: 'Error', description: result.error || `Failed to skip ${notification.variableName}.`, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || `An unexpected error occurred while skipping ${notification.variableName}.`, variant: 'destructive' });
      logger.error('Failed to skip notification', { error: e, notificationId: notification.notificationId });
    }
  }, [user.id, toast, router]);

  const handleUndoNotificationLog = useCallback(async (notification: ReminderNotificationDetails) => {
    logger.info('PatientDashboardDisplay: handleUndoNotificationLog called', { notificationId: notification.notificationId });
    try {
      // Call the new action for undoing
      const result = await undoNotificationAction({
        notificationId: notification.notificationId,
        userId: user.id,
        // scheduleId: notification.scheduleId, // scheduleId might not be needed by undoNotificationAction
      });
      if (result.success) {
        toast({ title: 'Undo Successful', description: `${notification.variableName} status reverted.`, variant: 'default' });
        router.refresh();
      } else {
        toast({ title: 'Error', description: result.error || `Failed to undo action for ${notification.variableName}.`, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || `An unexpected error occurred while undoing action for ${notification.variableName}.`, variant: 'destructive' });
      logger.error('Failed to undo notification log/skip', { error: e, notificationId: notification.notificationId });
    }
  }, [user.id, toast, router]);
  // --- End Callbacks ---

  // Placeholder for ImageAnalysisCapture handler
  const handleSaveSuccess = () => {
    logger.info('ImageAnalysisCapture saved, client component notified...');
    router.refresh(); // Refresh after image analysis save too
  };

  return (
    <div className="container space-y-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Patient Dashboard</h1>
        <ImageAnalysisCapture userId={user.id} onSaveSuccess={handleSaveSuccess} />
      </div>

      {/* Timeline Section */}
      <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Daily Timeline</h2>
          <UniversalTimeline
              rawMeasurements={measurementsForTimeline}
              rawNotifications={initialTimelineNotifications}
              date={new Date(initialDateForTimeline)}
              userTimezone={userTimezone}
              onAddMeasurement={handleAddMeasurementCallback}
              onUpdateMeasurement={async (measurement, newValue) => {
                logger.info("UniversalTimeline onUpdateMeasurement received in PatientDashboardDisplay", { measurementId: measurement.id, newValue });
                await handleEditMeasurementCallback(measurement, newValue); // Directly pass MeasurementCardData
              }}
              onLogNotificationMeasurement={handleLogNotificationMeasurement}
              onSkipNotification={handleSkipNotification}
              onUndoNotificationLog={handleUndoNotificationLog}
              showFilters={true}
              showDateNavigation={true}
              showAddButtons={true}
          />
          <MeasurementAddDialog
              isOpen={dialogOpen}
              onClose={() => setDialogOpen(false)}
              userVariables={filteredVariables}
              onSubmit={handleDialogSubmit}
          />
      </section>

      {/* Tracking Inbox */}
      {notifications && notifications.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Tracking Inbox</h2>
          <TrackingInbox userId={user.id} initialNotifications={notifications} />
        </section>
      )}

      {/* Conditions/Treatments Links */}
       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link href="/patient/conditions">
              <Button variant="outline" size="lg" className="w-full h-24 flex flex-col justify-center items-center gap-2">
                <HeartPulse className="h-6 w-6" />
                <span>Conditions</span>
              </Button>
            </Link>
            <Link href="/patient/treatments">
              <Button variant="outline" size="lg" className="w-full h-24 flex flex-col justify-center items-center gap-2">
                <Pill className="h-6 w-6" />
                <span>Treatments</span>
              </Button>
            </Link>
        </div>

    </div>
  );
} 