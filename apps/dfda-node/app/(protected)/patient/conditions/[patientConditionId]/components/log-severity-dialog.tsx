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
import { Tables } from "@/lib/database.types"
import { MessageSquarePlus } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { logMeasurementAction } from "@/lib/actions/measurements"
import { useToast } from "@/components/ui/use-toast"
import { createLogger } from "@/lib/logger"

const logger = createLogger("log-severity-dialog")

interface LogSeverityDialogProps {
  patientCondition: Tables<"patient_conditions_view">
}

export function LogSeverityDialog({ patientCondition }: LogSeverityDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Form state
  const [severity, setSeverity] = useState<number>(5) // Default to 5
  const [notes, setNotes] = useState<string>("")

  const handleSubmit = () => {
    if (!patientCondition.patient_id || !patientCondition.condition_id) {
        logger.error("Missing patient_id or condition_id", { patientCondition });
        toast({ title: "Error", description: "Cannot log severity. Missing required IDs.", variant: "destructive" });
        return;
    }

    const input = {
        userId: patientCondition.patient_id,
        globalVariableId: patientCondition.condition_id, // Condition ID is the global variable ID
        value: severity,
        notes: notes || null,
        // We omit unitId, letting the action find the default for the condition/variable
        // startAt defaults to now in the action
    };

    logger.info("Submitting severity log", { input });

    startTransition(async () => {
      try {
        const result = await logMeasurementAction(input);
        if (result.success) {
          toast({ title: "Success", description: "Severity logged successfully." });
          setOpen(false);
          // Reset form after successful submission
          setSeverity(5);
          setNotes("");
        } else {
          throw new Error(result.error || "Failed to log severity");
        }
      } catch (error) {
        logger.error("Failed to log severity", { error, input });
        toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to log severity.", variant: "destructive" });
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <MessageSquarePlus className="mr-2 h-4 w-4" /> Log Severity / Symptom
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Severity for {patientCondition.condition_name}</DialogTitle>
          <DialogDescription>
            Record how severe your {patientCondition.condition_name || "condition"} felt at a specific time.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Severity Slider */}
           <div className="grid gap-2">
            <Label htmlFor="severity">Severity (0-10)</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="severity"
                min={0}
                max={10}
                step={1}
                value={[severity]}
                onValueChange={(value) => setSeverity(value[0])}
                disabled={isPending}
                className="flex-1"
              />
              <span className="font-medium w-8 text-right">{severity}/10</span>
            </div>
             <p className="text-xs text-muted-foreground">0 = No symptoms, 10 = Worst imaginable</p>
          </div>

          {/* Notes Textarea */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea 
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details about how you felt..."
              rows={3}
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Logging..." : "Log Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 