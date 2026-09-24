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
import {
  PatientConditionRating,
  TreatmentRatingUpsertData,
  upsertTreatmentRatingAction,
} from "@/lib/actions/treatment-ratings"
import { PatientTreatmentWithName, getPatientTreatmentsAction } from "@/lib/actions/patient-treatments"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { createLogger } from "@/lib/logger"
import { useTransition, useEffect } from "react"

const logger = createLogger("rate-treatment-dialog")

interface RateTreatmentDialogProps {
  patientCondition: Tables<"patient_conditions_view">
  existingRating?: PatientConditionRating | null // Optional for editing
  children: React.ReactNode // Trigger element
}

export function RateTreatmentDialog({ patientCondition, existingRating, children }: RateTreatmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // State for the form
  const [patientTreatments, setPatientTreatments] = useState<PatientTreatmentWithName[]>([])
  const [selectedPatientTreatmentId, setSelectedPatientTreatmentId] = useState<string | undefined>(existingRating?.patient_treatment_id)
  const [effectiveness, setEffectiveness] = useState<number>(existingRating?.effectiveness_out_of_ten ?? 5) // Default to 5
  const [review, setReview] = useState<string>(existingRating?.review || "")

  // Fetch patient's active treatments when dialog opens (if not editing an existing rating)
  useEffect(() => {
    if (open && !existingRating) {
      const fetchTreatments = async () => {
        if (!patientCondition.patient_id) return; // Need patient ID
        try {
          const treatments = await getPatientTreatmentsAction(patientCondition.patient_id);
          setPatientTreatments(treatments);
          // If only one treatment, pre-select it
          if (treatments.length === 1) {
            setSelectedPatientTreatmentId(treatments[0].id);
          }
        } catch (error) {
          logger.error("Failed to fetch patient treatments for dialog", { error });
          toast({ title: "Error", description: "Could not load your treatments.", variant: "destructive" });
        }
      }
      fetchTreatments();
    }
    // Reset form if dialog closes or existingRating changes
    if (!open) {
       setSelectedPatientTreatmentId(existingRating?.patient_treatment_id)
       setEffectiveness(existingRating?.effectiveness_out_of_ten ?? 5)
       setReview(existingRating?.review || "")
    }
  }, [open, patientCondition.patient_id, existingRating, toast]);

  const handleSubmit = () => {
    logger.info("handleSubmit called"); // Log entry

    // Log validation values
    logger.info("Validating handleSubmit", { selectedPatientTreatmentId, patientConditionId: patientCondition.id });

    if (!selectedPatientTreatmentId) {
      toast({ title: "Error", description: "Please select a treatment to rate.", variant: "destructive" })
      return
    }
    if (!patientCondition.id) {
        toast({ title: "Error", description: "Condition ID missing.", variant: "destructive" })
        return
    }

    const ratingData: TreatmentRatingUpsertData = {
      patient_treatment_id: selectedPatientTreatmentId,
      patient_condition_id: patientCondition.id, // ID of the current condition page
      effectiveness_out_of_ten: effectiveness,
      review: review || null
    }

    // Log data before transition
    logger.info("Preparing to save rating data", { ratingData });

    startTransition(async () => {
      logger.info("Inside startTransition - Calling upsertTreatmentRatingAction"); // Log inside transition
      try {
        const result = await upsertTreatmentRatingAction(ratingData);
        if (result.success) {
          logger.info("Rating saved successfully (client)", { result });
          toast({ title: "Success", description: "Rating saved successfully." });
          setOpen(false);
        } else {
          logger.error("Server action returned failure", { result });
          throw new Error(result.error || "Failed to save rating");
        }
      } catch (error) {
        // Log error during the action call itself
        logger.error("Error during upsertTreatmentRatingAction call", { error, ratingData });
        toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to save rating.", variant: "destructive" });
      }
    })
  }

  const treatmentName = patientTreatments.find(t => t.id === selectedPatientTreatmentId)?.global_treatments?.global_variables?.name 
                       || existingRating?.treatment_name
                       || "Selected Treatment";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{existingRating ? `Edit Rating for ${existingRating.treatment_name}` : `Rate Treatment for ${patientCondition.condition_name}`}</DialogTitle>
          <DialogDescription>
            Rate how effective a treatment is for this specific condition ({patientCondition.condition_name}).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Treatment Selection - Only show if creating new */}
          {(!existingRating) && (
             <div className="grid gap-2">
                <Label htmlFor="treatment">Treatment</Label>
                <Select 
                  value={selectedPatientTreatmentId}
                  onValueChange={setSelectedPatientTreatmentId}
                  disabled={isPending || patientTreatments.length === 0}
                >
                  <SelectTrigger id="treatment">
                    <SelectValue placeholder={patientTreatments.length > 0 ? "Select treatment..." : "Loading treatments..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {patientTreatments.map(pt => (
                      <SelectItem key={pt.id} value={pt.id}>
                        {pt.global_treatments?.global_variables?.name || "Unnamed Treatment"} (Started: {pt.start_date ? new Date(pt.start_date).toLocaleDateString() : 'N/A'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          )}

          {/* Only show slider/review if editing OR a treatment is selected for new rating */}
          {(existingRating || selectedPatientTreatmentId) && (
            <>
              {/* Effectiveness Slider */}
              <div className="grid gap-2">
                <Label htmlFor="effectiveness">Effectiveness (for {patientCondition.condition_name})</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="effectiveness"
                    min={0}
                    max={10}
                    step={1}
                    value={[effectiveness]}
                    onValueChange={(value) => setEffectiveness(value[0])}
                    disabled={isPending || (!existingRating && !selectedPatientTreatmentId)} // Disable if creating and no treatment selected
                    className="flex-1"
                  />
                  <span className="font-medium w-8 text-right">{effectiveness}/10</span>
                </div>
                <p className="text-xs text-muted-foreground">0 = Not effective at all, 10 = Extremely effective</p>
              </div>

              {/* Review Textarea */}
              <div className="grid gap-2">
                <Label htmlFor="review">Review / Notes (Optional)</Label>
                <Textarea 
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder={`Share your experience with ${treatmentName} for ${patientCondition.condition_name}...`}
                  rows={4}
                  disabled={isPending || (!existingRating && !selectedPatientTreatmentId)} // Disable if creating and no treatment selected
                />
              </div>
            </>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
          {/* Disable save if creating and no treatment selected */}
          <Button onClick={handleSubmit} disabled={isPending || (!existingRating && !selectedPatientTreatmentId)}>
            {isPending ? "Saving..." : (existingRating ? "Update Rating" : "Save Rating")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 