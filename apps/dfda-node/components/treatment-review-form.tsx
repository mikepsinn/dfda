"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { upsertTreatmentRatingAction, type TreatmentRatingUpsertData } from "@/app/actions/treatment-ratings"
import { logger } from "@/lib/logger"
import { Loader2 } from "lucide-react"

interface TreatmentReviewFormProps {
  userId: string
  treatmentId: string
  conditionId: string
  onSuccess?: () => void
}

export function TreatmentReviewForm({ userId, treatmentId, conditionId, onSuccess }: TreatmentReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const ratingData: TreatmentRatingUpsertData = {
        patient_treatment_id: treatmentId,
        patient_condition_id: conditionId,
        effectiveness_out_of_ten: rating,
        review: review || null,
      }

      logger.info("Submitting treatment review", { ratingData })
      const result = await upsertTreatmentRatingAction(ratingData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your review has been submitted.",
        })

        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rating (0-10)</label>
        <p className="text-sm text-muted-foreground mb-3">0 = Not effective at all, 10 = Extremely effective</p>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <Button
              key={value}
              type="button"
              variant={rating === value ? "default" : "outline"}
              onClick={() => setRating(value)}
              className="w-10 h-10 p-0"
            >
              {value}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Review (Optional)</label>
        <Textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this treatment..."
          className="min-h-[100px]"
        />
      </div>

      <Button type="submit" disabled={!rating || isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  )
}
