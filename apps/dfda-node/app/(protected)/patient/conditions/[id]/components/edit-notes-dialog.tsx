"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tables } from "@/lib/database.types"
import { updatePatientConditionAction } from "@/app/actions/patient-conditions"
import { useToast } from "@/components/ui/use-toast"
import { createLogger } from "@/lib/logger"

const logger = createLogger("edit-notes-dialog")

interface EditNotesDialogProps {
  patientCondition: Tables<"patient_conditions_view">
  children: React.ReactNode // To wrap the trigger button/element
}

export function EditNotesDialog({ patientCondition, children }: EditNotesDialogProps) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(patientCondition.notes || "")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!patientCondition.id) {
        logger.error("Patient condition ID is missing", { patientCondition });
        toast({ title: "Error", description: "Could not save notes. Condition ID missing.", variant: "destructive" })
        return
    }

    startTransition(async () => {
      try {
        await updatePatientConditionAction(patientCondition.id!, { notes: notes || null })
        toast({ title: "Success", description: "Notes updated successfully." })
        setOpen(false)
      } catch (error) {
        logger.error("Failed to update notes", { error, patientConditionId: patientCondition.id });
        toast({ title: "Error", description: "Failed to save notes. Please try again.", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Notes</DialogTitle>
          <DialogDescription>
            Add or update notes for {patientCondition.condition_name || "this condition"}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter your notes here..."
            rows={6}
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}> 
            {isPending ? "Saving..." : "Save Notes"}
          </Button> 
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 