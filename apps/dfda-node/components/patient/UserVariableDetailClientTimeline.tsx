"use client"

import React, { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { UniversalTimeline } from "@/components/universal-timeline"
import { updateMeasurementAction, logMeasurementAction } from "@/lib/actions/measurements"
import { MeasurementAddDialog } from "@/components/patient/MeasurementAddDialog"
import type { UserVariableWithDetails } from "@/lib/actions/user-variables";
import type { MeasurementCardData } from "@/components/measurement-card";
import type { ReminderNotificationCardData } from "@/components/reminder-notification-card";

export interface UserVariableDetailClientTimelineProps {
  items: (MeasurementCardData | ReminderNotificationCardData)[];
  date: Date;
  userTimezone: string;
  userId: string;
  userVariable: UserVariableWithDetails;
}

export function UserVariableDetailClientTimeline({ items: allItems, date, userTimezone, userId, userVariable }: UserVariableDetailClientTimelineProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)

  // Separate items into measurements and notifications
  const measurementsForTimeline: MeasurementCardData[] = useMemo(() => {
    return allItems.filter((item): item is MeasurementCardData => 'start_at' in item && !('reminderScheduleId' in item));
  }, [allItems]);

  const notificationsForTimeline: ReminderNotificationCardData[] = useMemo(() => {
    return allItems.filter((item): item is ReminderNotificationCardData => 'triggerAtUtc' in item && 'reminderScheduleId' in item);
  }, [allItems]);

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
        rawMeasurements={measurementsForTimeline}
        rawNotifications={notificationsForTimeline}
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
