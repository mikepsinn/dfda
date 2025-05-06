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
import { UniversalTimeline, type TimelineItem, type FilterableVariableCategoryId } from '@/components/universal-timeline';
import type { MeasurementNotificationItemData } from '@/components/shared/measurement-notification-item';
import { MeasurementAddDialog } from './MeasurementAddDialog';

// Import Server Actions needed for callbacks
import { updateMeasurementAction, logMeasurementAction } from '@/lib/actions/measurements';

// Import Types
import type { User } from '@supabase/supabase-js';
import type { Tables } from '@/lib/database.types';
import type { PendingNotificationTask } from '@/lib/actions/reminder-schedules';
import type { UserVariableWithDetails } from "@/lib/actions/user-variables";

// Define types using the Tables helper
type PatientConditionRow = Tables<'patient_conditions_view'>;

interface PatientDashboardDisplayProps {
  initialUser: User;
  initialPendingNotifications: PendingNotificationTask[];
  initialTimelineItems: TimelineItem[];
  initialUserVariables: UserVariableWithDetails[];
  initialConditions: PatientConditionRow[]; // Or any[] for now if type is complex
}

export default function PatientDashboardDisplay({
  initialUser,
  initialPendingNotifications,
  initialTimelineItems,
  initialUserVariables,
  initialConditions // Destructure the new prop
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

  // Data for Timeline (from props)
  const timelineItems = initialTimelineItems;
  const userVariables = initialUserVariables;

  // Separate timelineItems into measurements and notifications
  const measurementsForTimeline: MeasurementNotificationItemData[] = [];
  const notificationsForTimeline: MeasurementNotificationItemData[] = [];

  timelineItems.forEach(item => {
    // Heuristic: if it has a reminderScheduleId, it's likely a notification.
    // Otherwise, or if its status is 'recorded', treat as a measurement.
    // This might need refinement based on actual data structure and how status is set.
    if (item.reminderScheduleId || (item.status !== "recorded" && item.status !== "pending" /* consider other notification-like statuses if any */)) {
      notificationsForTimeline.push(item);
    } else {
      measurementsForTimeline.push(item);
    }
  });

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

  const handleEditMeasurementCallback = useCallback(async (item: TimelineItem, value: number, unitAbbr: string, notes?: string) => {
      logger.info('DashboardDisplay: handleEditMeasurementCallback called', { itemId: item.id, value, unitAbbr });
      try {
          const result = await updateMeasurementAction({ measurementId: item.id, userId: user.id, value, unitId: unitAbbr, notes: notes ?? undefined });
          if (!result.success) {
              toast({ title: 'Error', description: result.error || 'Failed to update measurement.', variant: 'destructive' });
          } else {
              toast({ title: 'Measurement Updated', description: 'Measurement details saved.', variant: 'default' });
              router.refresh(); // Re-enable refresh
          }
      } catch (e: any) {
          toast({ title: 'Error', description: e?.message || 'Failed to update measurement.', variant: 'destructive' });
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
              measurements={measurementsForTimeline}
              notifications={notificationsForTimeline}
              date={new Date()}
              userTimezone={userTimezone}
              onEditMeasurement={handleEditMeasurementCallback}
              onAddMeasurement={handleAddMeasurementCallback}
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