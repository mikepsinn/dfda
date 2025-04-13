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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { TreatmentSearch } from "./treatment-search"
import type { Database } from "@/lib/database.types"
import { createLogger } from "@/lib/logger"
import { ConditionCombobox } from "./condition-combobox"
import { addPatientConditionAction } from "@/app/actions/patientConditions"
import { upsertTreatmentRatingAction, type TreatmentRatingUpsertData } from "@/app/actions/treatment-ratings"
import { Loader2 } from "lucide-react"

type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"]

const logger = createLogger("add-treatment-dialog")

interface AddTreatmentDialogProps {
  userId: string
  conditions: PatientCondition[]
}

const NOT_SPECIFIED_VALUE = "not-specified"

export function AddTreatmentDialog({ userId, conditions }: AddTreatmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<{ id: string; name: string } | null>(null)
  const [selectedCondition, setSelectedCondition] = useState<string>("")
  const [effectiveness, setEffectiveness] = useState<number | null>(null)
  const [review, setReview] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const isExistingPatientCondition = conditions.some(pc => pc.condition_id === selectedCondition)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    logger.info("Submitting new treatment rating", { 
      patientTreatmentId: selectedTreatment?.id, 
      conditionId: selectedCondition, 
      rating: effectiveness, 
      review 
    })

    if (!selectedTreatment || !selectedCondition || effectiveness === null) {
      toast.error("Missing required information (treatment, condition, or effectiveness rating).")
      setIsLoading(false)
      return
    }

    const ratingData: TreatmentRatingUpsertData = {
      patient_treatment_id: selectedTreatment.id,
      patient_condition_id: selectedCondition,
      effectiveness_out_of_ten: effectiveness,
      review: review || null,
    }

    try {
      const result = await upsertTreatmentRatingAction(ratingData)
      if (result.success) {
        toast.success(result.message || "Rating added successfully!")
        setOpen(false)
        setSelectedTreatment(null)
        setSelectedCondition("")
        setEffectiveness(null)
        setReview("")
      } else {
        toast.error(result.error || "Failed to add rating.")
      }
    } catch (error) {
      logger.error("Error submitting treatment rating", { error, ratingData })
      toast.error("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  // Reset form state if dialog is closed without submitting
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSelectedTreatment(null)
      setSelectedCondition("")
      setEffectiveness(null)
      setReview("")
      setIsLoading(false) // Reset loading state as well
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Treatment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Treatment</DialogTitle>
          <DialogDescription>
            Add a treatment and rate its effectiveness for your condition.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="treatment">Treatment</Label>
              <TreatmentSearch
                onSelect={(treatment) => setSelectedTreatment(treatment)}
                selected={selectedTreatment}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="condition">Condition</Label>
              <ConditionCombobox
                patientConditions={conditions}
                value={selectedCondition}
                onValueChange={setSelectedCondition}
              />
            </div>

            {selectedTreatment && selectedCondition && selectedCondition !== NOT_SPECIFIED_VALUE && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="effectiveness">Effectiveness (0-10)</Label>
                  <Select
                    value={effectiveness?.toString() || ""}
                    onValueChange={(value) => setEffectiveness(parseInt(value))}
                    required // Make effectiveness required if condition is selected
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rate effectiveness" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i} - {i === 0 ? "Not effective" : i === 10 ? "Very effective" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="review">Review (Optional)</Label>
                  <Textarea
                    id="review"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience with this treatment..."
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={
                !selectedTreatment || 
                // Disable if a specific condition is selected but effectiveness is not
                (selectedCondition && selectedCondition !== NOT_SPECIFIED_VALUE && effectiveness === null) || 
                isLoading
              }
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Treatment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 