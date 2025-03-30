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
import type { PatientCondition } from "@/lib/database.types"
import { createLogger } from "@/lib/logger"

const logger = createLogger("add-treatment-dialog")

interface AddTreatmentDialogProps {
  userId: string
  conditions: PatientCondition[]
}

export function AddTreatmentDialog({ userId, conditions }: AddTreatmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<{ id: string; name: string } | null>(null)
  const [selectedCondition, setSelectedCondition] = useState<string>("")
  const [effectiveness, setEffectiveness] = useState<number | null>(null)
  const [review, setReview] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTreatment || !selectedCondition || effectiveness === null) return

    setIsLoading(true)
    try {
      logger.info("Adding treatment for user", { userId, treatmentId: selectedTreatment.id })
      
      // First create the patient treatment
      const response = await fetch("/api/patient/treatments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          treatment_id: selectedTreatment.id,
          condition_id: selectedCondition,
          effectiveness_out_of_ten: effectiveness,
          review: review || null,
        }),
      })

      if (!response.ok) throw new Error("Failed to add treatment")

      toast({
        title: "Treatment added",
        description: `${selectedTreatment.name} has been added to your treatments.`
      })

      setOpen(false)
      setSelectedTreatment(null)
      setSelectedCondition("")
      setEffectiveness(null)
      setReview("")
    } catch (error) {
      logger.error("Failed to add treatment", { 
        error, 
        userId, 
        treatmentId: selectedTreatment?.id, 
        conditionId: selectedCondition 
      })
      
      toast({
        title: "Error",
        description: "Failed to add treatment. Please try again.",
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
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={selectedCondition}
                onValueChange={setSelectedCondition}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition.id} value={condition.id}>
                      {condition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="treatment">Treatment</Label>
              <TreatmentSearch
                onSelect={(treatment) => setSelectedTreatment(treatment)}
                selected={selectedTreatment}
                conditionId={selectedCondition}
              />
            </div>

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
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={!selectedTreatment || !selectedCondition || effectiveness === null || isLoading}
            >
              {isLoading ? "Adding..." : "Add Treatment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 