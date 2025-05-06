"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { UniversalTimeline } from "@/components/universal-timeline"
import type { TimelineItem, MeasurementStatus, FilterableVariableCategoryId } from "@/components/universal-timeline"
import { completeReminderNotificationAction } from "@/lib/actions/reminder-schedules"
import { updateMeasurementAction, logMeasurementAction } from "@/lib/actions/measurements"
import { MeasurementAddDialog } from "@/components/patient/MeasurementAddDialog"

export interface UserVariableDetailClientTimelineProps {
  items: TimelineItem[];
  date: Date;
  userTimezone: string;
  userId: string;
  userVariableId: string;
}

export function UserVariableDetailClientTimeline({ items, date, userTimezone, userId, userVariableId }: UserVariableDetailClientTimelineProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [dialogCategory, setDialogCategory] = useState<FilterableVariableCategoryId | null>(null)

  const handleAddMeasurementCallback = useCallback((categoryId: FilterableVariableCategoryId) => {
    setDialogCategory(categoryId)
    setDialogOpen(true)
  }, [])

  const handleDialogSubmit = useCallback(async ({ userVariableId: uvId, value, unit, notes }: { userVariableId: string; value: number; unit: string; notes?: string }) => {
    try {
      const result = await logMeasurementAction({ userId, globalVariableId: uvId, value, unitId: unit, notes })
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
  }, [userId, toast, router])

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
        userVariables={[{ id: userVariableId }]}
        onSubmit={handleDialogSubmit}
      />
    </>
  )
}
