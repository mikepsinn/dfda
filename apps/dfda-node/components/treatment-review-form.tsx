"use client"

import React, { useState } from 'react'
import { StarRating as Rating } from "@/components/ui/star-rating"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import { upsertTreatmentRatingAction, type TreatmentRatingUpsertData } from "@/app/actions/treatment-ratings"
import { logger } from "@/lib/logger"

interface TreatmentReviewFormProps {
  treatmentId: string;
  patientConditionId: string; 
  onReviewSubmitted?: () => void;
}

export function TreatmentReviewForm({ 
  treatmentId, 
  patientConditionId, 
  onReviewSubmitted 
}: TreatmentReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const ratingData: TreatmentRatingUpsertData = {
        patient_treatment_id: treatmentId,
        patient_condition_id: patientConditionId,
        effectiveness_out_of_ten: rating,
        review: review || null,
      }

      logger.info("Submitting treatment review", { ratingData })
      const result = await upsertTreatmentRatingAction(ratingData)

      if (result.success) {
      toast.success("Your review has been submitted.")

      if (onReviewSubmitted) {
        onReviewSubmitted()
        }
      } else {
        toast.error("Failed to submit review. Please try again.")
      }
    } catch {
      toast.error("Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rating (0-10)</label>
        <p className="text-sm text-muted-foreground mb-3">0 = Not effective at all, 10 = Extremely effective</p>
        <Rating 
           rating={rating}
           onChange={setRating}
           maxRating={10}
           size="lg"
        />
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
