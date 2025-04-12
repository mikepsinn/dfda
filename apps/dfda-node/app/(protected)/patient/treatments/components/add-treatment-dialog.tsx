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
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import { TreatmentSearch } from "./treatment-search"
import type { Database } from "@/lib/database.types"
import { createLogger } from "@/lib/logger"
import { ConditionCombobox } from "./condition-combobox"
import { addPatientConditionAction } from "@/app/actions/patientConditions"
import { addTreatmentRatingAction } from "@/app/actions/treatment-ratings"

type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"]
type TreatmentRatingInsert = Database["public"]["Tables"]["treatment_ratings"]["Insert"]

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
  const { toast } = useToast()

  const isExistingPatientCondition = conditions.some(pc => pc.condition_id === selectedCondition)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTreatment || !selectedCondition) return
    if (selectedCondition !== NOT_SPECIFIED_VALUE && effectiveness === null) return

    setIsLoading(true)
    try {
      logger.info("Adding treatment rating for user", { userId, treatmentId: selectedTreatment.id, conditionId: selectedCondition })

      if (selectedCondition !== NOT_SPECIFIED_VALUE && !isExistingPatientCondition) {
        logger.info("Adding new condition for patient", { userId, conditionId: selectedCondition })
        const conditionResult = await addPatientConditionAction(userId, selectedCondition)
        if (!conditionResult.success) {
          throw new Error(conditionResult.error || "Failed to add condition")
        }
      }

      const ratingData: Omit<TreatmentRatingInsert, 'condition_id'> & { condition_id: string | null } = {
        user_id: userId,
        treatment_id: selectedTreatment.id,
        condition_id: selectedCondition === NOT_SPECIFIED_VALUE ? null : selectedCondition,
        effectiveness_out_of_ten: selectedCondition === NOT_SPECIFIED_VALUE ? null : effectiveness,
        review: review || null,
      }

      logger.info("Submitting treatment rating data", { ratingData })
      const ratingResult = await addTreatmentRatingAction(ratingData as any)

      if (!ratingResult.success) {
        throw new Error(ratingResult.error || "Failed to add treatment rating")
      }

      toast({
        title: "Treatment added",
        description: `${selectedTreatment.name} has been added successfully.`
      })

      setOpen(false)
      setSelectedTreatment(null)
      setSelectedCondition("")
      setEffectiveness(null)
      setReview("")
    } catch (error: any) {
      logger.error("Failed to add treatment/rating", { 
        error: error?.message ?? String(error), 
        userId, 
        treatmentId: selectedTreatment?.id, 
        conditionId: selectedCondition 
      })
      
      toast({
        title: "Error",
        description: error?.message || "Failed to add treatment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                !selectedCondition || 
                (selectedCondition !== NOT_SPECIFIED_VALUE && effectiveness === null) || 
                isLoading
              }
            >
              {isLoading ? "Adding..." : "Add Treatment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 