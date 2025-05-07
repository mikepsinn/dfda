"use client"

import React, { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { UniversalTimeline } from "@/components/universal-timeline"
import type { TimelineItem } from "@/components/universal-timeline"
import type { MeasurementNotificationItemData } from '@/components/shared/measurement-notification-item';
import { updateMeasurementAction, logMeasurementAction } from "@/lib/actions/measurements"
import { MeasurementAddDialog } from "@/components/patient/MeasurementAddDialog"
import type { UserVariableWithDetails } from "@/lib/actions/user-variables";
import type { MeasurementCardData } from "@/components/measurement-card";

export interface UserVariableDetailClientTimelineProps {
  items: TimelineItem[];
  date: Date;
  userTimezone: string;
  userId: string;
  userVariable: UserVariableWithDetails;
}

export function UserVariableDetailClientTimeline({ items: allItems, date, userTimezone, userId, userVariable }: UserVariableDetailClientTimelineProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)

  // Separate items into measurements and notifications (original logic)
  // Memoize the creation of rawMeasurementsForTimeline
  const rawMeasurementsForTimeline: MeasurementNotificationItemData[] = useMemo(() => {
    const measurements: MeasurementNotificationItemData[] = [];
    // const notifications: MeasurementNotificationItemData[] = []; // Not currently used for rawNotifications
    allItems.forEach(item => {
      if (item.reminderScheduleId) {
        // notifications.push(item); // If we were to handle these as PendingNotificationTask
      } else {
        measurements.push(item);
      }
    });
    return measurements;
  }, [allItems]);
  
  // const notificationsForTimeline: MeasurementNotificationItemData[] = []; // Not currently used for rawNotifications

  // allItems.forEach(item => {
  //   // Simplified: assume all items here are primarily for measurement display if not explicitly a notification
  //   if (item.reminderScheduleId) {
  //     // notificationsForTimeline.push(item); // If we were to handle these as PendingNotificationTask
  //   } else {
  //     rawMeasurementsForTimeline.push(item);
  //   }
  // });

  // Map rawMeasurementsForTimeline (MeasurementNotificationItemData[]) to MeasurementCardData[]
  const mappedMeasurementsForTimeline: MeasurementCardData[] = useMemo(() => {
    return rawMeasurementsForTimeline.map(item => ({
      id: item.id,
      globalVariableId: item.globalVariableId,
      userVariableId: item.userVariableId,
      variableCategoryId: item.variableCategoryId,
      name: item.name,
      start_at: item.triggerAtUtc,
      end_at: undefined, // MeasurementNotificationItemData does not have end_at
      value: item.value,
      unit: item.unit,
      unitId: item.unitId,
      unitName: item.unitName || item.unit,
      notes: item.notes,
      isEditable: item.isEditable,
      emoji: item.emoji ?? undefined,
    }));
  }, [rawMeasurementsForTimeline]);

  const handleAddMeasurementCallback = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const handleDialogSubmit = useCallback(async ({ value, unit, notes }: { userVariableId: string; value: number; unit: string; notes?: string }) => {
    try {
      if (!userVariable.global_variable_id) {
        toast({ title: "Error", description: "No global variable ID found for this variable.", variant: "destructive" })
        return
      }
      const result = await logMeasurementAction({ userId, globalVariableId: userVariable.global_variable_id, value, unitId: unit, notes })
      if (!result.success) {
        toast({ title: "Error", description: result.error || "Failed to add measurement.", variant: "destructive" })
      } else {
        toast({ title: "Measurement Added", description: "Measurement logged.", variant: "default" })
        router.refresh()
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to add measurement.", variant: "destructive" })
    } finally {
      setDialogOpen(false)
    }
  }, [userId, toast, router, userVariable])

  const handleEditMeasurementCallback = useCallback(async (measurementToUpdate: MeasurementCardData, newValue: number) => {
    try {
      const result = await updateMeasurementAction({ 
        measurementId: measurementToUpdate.id, 
        userId, 
        value: newValue, 
        unitId: measurementToUpdate.unitId, 
        notes: measurementToUpdate.notes ?? undefined 
      })
      if (!result.success) {
        toast({ title: "Error", description: result.error || "Failed to update measurement.", variant: "destructive" })
      } else {
        toast({ title: "Measurement Updated", description: "Details saved.", variant: "default" })
        router.refresh()
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to update measurement.", variant: "destructive" })
    }
  }, [userId, toast, router])

  return (
    <>
      <UniversalTimeline
        rawMeasurements={mappedMeasurementsForTimeline}
        rawNotifications={[]}
        date={date}
        userTimezone={userTimezone}
        onAddMeasurement={handleAddMeasurementCallback}
        onUpdateMeasurement={handleEditMeasurementCallback}
        showAddButtons
        showFilters
        showDateNavigation
      />
      <MeasurementAddDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        userVariables={[userVariable]}
        onSubmit={handleDialogSubmit}
      />
    </>
  )
}
