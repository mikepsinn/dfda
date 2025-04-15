"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tables } from "@/lib/database.types"
import { Pencil } from "lucide-react"
import { updatePatientConditionAction } from "@/app/actions/patient-conditions"
import { useToast } from "@/components/ui/use-toast"
import { createLogger } from "@/lib/logger"

const logger = createLogger("edit-condition-dialog")

// Define possible statuses and severities (adjust as needed)
const conditionStatuses = ["active", "inactive", "resolved", "unknown"]
const conditionSeverities = ["mild", "moderate", "severe", "unknown"]

interface EditConditionDialogProps {
  patientCondition: Tables<"patient_conditions_view">
  children: React.ReactNode
}

export function EditConditionDialog({ patientCondition, children }: EditConditionDialogProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(patientCondition.status || "unknown")
  const [severity, setSeverity] = useState(patientCondition.severity || "unknown")
  // Format date for input type="date" (YYYY-MM-DD)
  const [diagnosedAt, setDiagnosedAt] = useState(
    patientCondition.diagnosed_at ? format(new Date(patientCondition.diagnosed_at), 'yyyy-MM-dd') : ""
  )
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = () => {
    if (!patientCondition.id) {
        logger.error("Patient condition ID is missing", { patientCondition });
        toast({ title: "Error", description: "Could not save condition. ID missing.", variant: "destructive" })
        return
    }

    const updates: Partial<Tables<"patient_conditions">> = {
        status: status === "unknown" ? null : status,
        severity: severity === "unknown" ? null : severity,
        diagnosed_at: diagnosedAt ? new Date(diagnosedAt).toISOString() : null
    }

    startTransition(async () => {
      try {
        await updatePatientConditionAction(patientCondition.id!, updates)
        toast({ title: "Success", description: "Condition updated successfully." })
        setOpen(false)
      } catch (error) {
        logger.error("Failed to update condition", { error, patientConditionId: patientCondition.id, updates });
        toast({ title: "Error", description: "Failed to save condition. Please try again.", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {patientCondition.condition_name}</DialogTitle>
          <DialogDescription>
            Update the details for this condition.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select 
              value={status}
              onValueChange={setStatus}
              disabled={isPending}
            >
              <SelectTrigger id="status" className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {conditionStatuses.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="severity" className="text-right">Severity</Label>
             <Select 
              value={severity}
              onValueChange={setSeverity}
              disabled={isPending}
            >
              <SelectTrigger id="severity" className="col-span-3">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {conditionSeverities.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="diagnosedAt" className="text-right">Diagnosed Date</Label>
            <Input 
              id="diagnosedAt"
              type="date" 
              value={diagnosedAt}
              onChange={(e) => setDiagnosedAt(e.target.value)}
              className="col-span-3"
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
             {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 