"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/ui/star-rating"
import { createTreatmentRatingAction, updateTreatmentRatingAction } from "@/app/actions/treatment-ratings"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

interface TreatmentReviewFormProps {
  userId: string
  treatmentId: string
  conditionId: string
  userType: "patient" | "doctor"
  existingReview?: {
    id: string
    rating: number
    review: string
  }
  onSuccess?: () => void
}

export function TreatmentReviewForm({
  userId,
  treatmentId,
  conditionId,
  userType,
  existingReview,
  onSuccess,
}: TreatmentReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [review, setReview] = useState(existingReview?.review || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (existingReview) {
        await updateTreatmentRatingAction(existingReview.id, {
          rating,
          review,
          updated_at: new Date().toISOString(),
        })
        toast({
          title: "Review updated",
          description: "Your review has been updated successfully",
        })
      } else {
        const newReview = {
          treatment_id: treatmentId,
          condition_id: conditionId,
          user_id: userId,
          effectiveness_out_of_ten: rating,
          review: review,
          unit_id: 'test-unit-1' // TODO: Get actual unit ID
        }

        const { error } = await supabase
          .from('treatment_ratings')
          .insert(newReview)

        if (error) {
          logger.error('Error submitting review:', error)
          setError('Failed to submit review. Please try again.')
          return
        }

        toast({
          title: "Review submitted",
          description: "Your review has been submitted successfully",
        })
      }

      if (onSuccess) {
        onSuccess()
      }

      router.refresh()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: "There was an error submitting your review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Your Rating</label>
        <StarRating rating={rating} onChange={setRating} size="lg" />
      </div>

      <div className="space-y-2">
        <label htmlFor="review" className="block text-sm font-medium">
          Your Review (Optional)
        </label>
        <Textarea
          id="review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this treatment..."
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full">
        {isSubmitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
      </Button>
    </form>
  )
}
