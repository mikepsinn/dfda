"use client"

import { useState } from "react"
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
import { Tables } from "@/lib/database.types"
import { MessageSquarePlus } from "lucide-react"

interface LogSeverityDialogProps {
  patientCondition: Tables<"patient_conditions_view">
  // children: React.ReactNode // Using direct trigger for now
}

export function LogSeverityDialog({ patientCondition }: LogSeverityDialogProps) {
  const [open, setOpen] = useState(false)

  // TODO: Add form fields (e.g., severity scale, notes, date/time)
  // TODO: Implement form submission to create measurement/log entry

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <MessageSquarePlus className="mr-2 h-4 w-4" /> Log Severity / Symptom
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Severity for {patientCondition.condition_name}</DialogTitle>
          <DialogDescription>
            Record how you're feeling or the severity of your symptoms.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* TODO: Add form fields here (e.g., slider, radio group, text area) */}
          <p>Form fields for logging severity will go here.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">Log Entry</Button> {/* TODO: Add form submission handler */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 