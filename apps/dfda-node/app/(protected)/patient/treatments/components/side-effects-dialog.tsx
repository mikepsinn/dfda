'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createLogger } from '@/lib/logger'
import type { Database } from '@/lib/database.types'
// Import the updated server actions
import { getSideEffectReportsForPatientTreatmentAction, reportSideEffectAction } from '@/app/actions/treatment-side-effects'

const logger = createLogger('side-effects-dialog')

type ReportedSideEffect = Database["public"]["Tables"]["patient_side_effects"]["Row"]
// Define Insert type based on the action's expected payload
type ReportedSideEffectInsertPayload = Omit<Database["public"]["Tables"]["patient_side_effects"]["Insert"], 'id' | 'created_at' | 'updated_at' | 'deleted_at'>

interface SideEffectsDialogProps {
  patientTreatmentId: string
  treatmentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void // Optional callback after successful submission
}

export function SideEffectsDialog({ 
  patientTreatmentId, 
  treatmentName, 
  open, 
  onOpenChange,
  onSuccess 
}: SideEffectsDialogProps) {
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<string>("") // Severity stored as string for Select
  const [isLoading, setIsLoading] = useState(false)
  const [existingEffects, setExistingEffects] = useState<ReportedSideEffect[]>([])
  const [isLoadingExisting, setIsLoadingExisting] = useState(false)
  const { toast } = useToast()

  const fetchExisting = useCallback(async () => {
    if (!patientTreatmentId) return; // Don't fetch if ID is missing
    setIsLoadingExisting(true)
    logger.info('Fetching existing side effects', { patientTreatmentId })
    try {
      const effects = await getSideEffectReportsForPatientTreatmentAction(patientTreatmentId)
      setExistingEffects(effects || [])
      logger.info('Successfully fetched existing side effects', { patientTreatmentId, count: effects.length })
    } catch (error: any) {
      logger.error('Error fetching existing side effects', { patientTreatmentId, error: error.message })
      toast({ title: "Error", description: "Could not load existing side effects.", variant: "destructive" })
    } finally {
      setIsLoadingExisting(false)
    }
  }, [patientTreatmentId, toast])

  useEffect(() => {
    if (open) {
      fetchExisting();
    }
  }, [open, fetchExisting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !severity) {
        toast({ title: "Missing Information", description: "Please provide a description and severity.", variant: "destructive" })
        return;
    }
    setIsLoading(true)
    logger.info('Submitting new side effect report', { patientTreatmentId, description, severity })

    try {
      const severityValue = parseInt(severity, 10);
      if (isNaN(severityValue)) throw new Error("Invalid severity value");

      // Prepare data for server action using the defined payload type
      const reportData: ReportedSideEffectInsertPayload = {
        patient_treatment_id: patientTreatmentId,
        description: description,
        severity_out_of_ten: severityValue,
      }
      
      await reportSideEffectAction(reportData)
      logger.info('Successfully reported side effect', { patientTreatmentId })
     
      toast({ title: "Success", description: "Side effect reported successfully." })
      setDescription('')
      setSeverity("")
      fetchExisting() // Re-fetch existing effects to update the list
      if (onSuccess) onSuccess() // Call success callback if provided
      // Keep dialog open on success for now, user can close manually or add more
      // onOpenChange(false) // Optionally close dialog on success
    } catch (error: any) { 
      logger.error('Error reporting side effect', { patientTreatmentId, error: error.message })
      toast({ title: "Error", description: error.message || "Failed to report side effect.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Side Effects for {treatmentName}</DialogTitle>
          <DialogDescription>
            Share any side effects you experienced while taking this treatment during this period.
          </DialogDescription>
        </DialogHeader>
        
        {/* Section to Display Existing Side Effects */} 
        <div className="mt-4">
            <h4 className="font-medium mb-2 text-sm">Previously Reported Effects:</h4>
            {isLoadingExisting ? (
                <p className="text-muted-foreground text-sm">Loading effects...</p>
            ) : existingEffects.length > 0 ? (
                <ScrollArea className="h-[150px] border rounded-md p-3">
                    <div className="space-y-3">
                        {existingEffects.map((effect, index) => (
                            <div key={effect.id} className="text-sm">
                                <p><strong>Description:</strong> {effect.description}</p>
                                <p><strong>Severity:</strong> {effect.severity_out_of_ten ?? 'N/A'}/10</p>
                                <p className="text-xs text-muted-foreground">
                                    Reported: {effect.created_at ? new Date(effect.created_at).toLocaleDateString() : 'Unknown'}
                                </p>
                                {index < existingEffects.length - 1 && <Separator className="my-2" />} 
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <p className="text-muted-foreground text-sm">No side effects previously reported for this treatment period.</p>
            )}
        </div>

        <Separator className="my-4" />

        {/* Form to Add New Side Effect */} 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Side Effect Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Headache, Nausea, Dizziness..."
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="severity">Severity (0=None, 10=Severe)</Label>
            <Select value={severity} onValueChange={setSeverity} required>
                <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Rate severity..." />
                </SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                            {i} - {i === 0 ? "None" : i === 10 ? "Severe" : ""}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <DialogFooter>
             <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || !description || !severity}>
              {isLoading ? "Reporting..." : "Report Side Effect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 