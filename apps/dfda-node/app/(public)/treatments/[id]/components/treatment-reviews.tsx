"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TreatmentReviewForm } from "@/components/treatment-review-form"
import { TreatmentReviewsList } from "@/components/treatment-reviews-list"
import { useRouter } from "next/navigation"

interface TreatmentReviewsProps {
  treatmentId: string
  conditionId: string
  ratings: any[]
  averageRating: number
  totalReviews: number
  userRating: any | null
  isLoggedIn: boolean
}

export function TreatmentReviews({
  treatmentId,
  conditionId,
  ratings,
  averageRating,
  totalReviews,
  userRating,
  isLoggedIn,
}: TreatmentReviewsProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const router = useRouter()

  const handleReviewSuccess = () => {
    setShowReviewForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reviews & Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoggedIn ? (
            userRating ? (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Your Review</h3>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={i < userRating.rating ? "currentColor" : "none"}
                        stroke="currentColor"
                        className={`h-5 w-5 ${i < userRating.rating ? "text-yellow-400" : "text-gray-300"}`}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    ))}
                  </div>
                  {userRating.review && <p>{userRating.review}</p>}
                </div>
                <Button variant="outline" onClick={() => setShowReviewForm(true)}>
                  Edit Your Review
                </Button>
              </div>
            ) : (
              <div>
                {showReviewForm ? (
                  <TreatmentReviewForm
                    treatmentId={treatmentId}
                    patientConditionId={conditionId}
                    onReviewSubmitted={handleReviewSuccess}
                  />
                ) : (
                  <div className="text-center py-4">
                    <p className="mb-4">Share your experience with this treatment</p>
                    <Button onClick={() => setShowReviewForm(true)}>Write a Review</Button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-4">
              <p className="mb-4">Sign in to leave a review</p>
              <Button asChild>
                <a href="/login?redirect=/treatment/${treatmentId}?condition=${conditionId}">Sign In</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <TreatmentReviewsList reviews={ratings} averageRating={averageRating} totalReviews={totalReviews} />
        </CardContent>
      </Card>
    </div>
  )
}

