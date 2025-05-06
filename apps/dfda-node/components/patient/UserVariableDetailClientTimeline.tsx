"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { UniversalTimeline } from "@/components/universal-timeline"
import type { TimelineItem, MeasurementStatus } from "@/components/universal-timeline"
import { completeReminderNotificationAction } from "@/lib/actions/reminder-schedules"
import { updateMeasurementAction, logMeasurementAction } from "@/lib/actions/measurements"
import { MeasurementAddDialog } from "@/components/patient/MeasurementAddDialog"
import type { UserVariableWithDetails } from "@/lib/actions/user-variables";

export interface UserVariableDetailClientTimelineProps {
  items: TimelineItem[];
  date: Date;
  userTimezone: string;
  userId: string;
  userVariable: UserVariableWithDetails;
}

export function UserVariableDetailClientTimeline({ items, date, userTimezone, userId, userVariable }: UserVariableDetailClientTimelineProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)

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

  const handleStatusChangeCallback = useCallback(async (item: TimelineItem, status: MeasurementStatus) => {
    try {
      const result = await completeReminderNotificationAction(item.id, userId, status === "skipped")
      if (!result.success) {
        toast({ title: "Error", description: result.error || "Failed to update status.", variant: "destructive" })
      } else {
        toast({ title: "Status Updated", description: "Status changed.", variant: "default" })
        router.refresh()
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to update status.", variant: "destructive" })
    }
  }, [userId, toast, router])

  const handleEditMeasurementCallback = useCallback(async (item: TimelineItem, value: number, unitAbbr: string, notes?: string) => {
    try {
      const result = await updateMeasurementAction({ measurementId: item.id, userId, value, unitId: unitAbbr, notes: notes ?? undefined })
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
        items={items}
        date={date}
        userTimezone={userTimezone}
        onAddMeasurement={handleAddMeasurementCallback}
        onEditMeasurement={handleEditMeasurementCallback}
        onStatusChange={handleStatusChangeCallback}
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
