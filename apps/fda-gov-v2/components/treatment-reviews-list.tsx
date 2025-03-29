"use client"

import React, { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ThumbsUp, User, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { markRatingAsHelpfulAction } from "@/app/actions/treatment-ratings"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type TreatmentRating = Database["public"]["Tables"]["treatment_ratings"]["Row"]

// Use the existing database fields instead of adding new ones
type Review = TreatmentRating & {
  user: Profile
}

interface TreatmentReviewsListProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export function TreatmentReviewsList({
  reviews: initialReviews,
  averageRating,
  totalReviews,
}: TreatmentReviewsListProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [filter, setFilter] = useState<"all" | "patient" | "doctor">("all")
  const [sort, setSort] = useState<"recent" | "highest" | "lowest" | "helpful">("recent")
  const { toast } = useToast()

  const filteredReviews = reviews.filter((review) => {
    if (filter === "all") return true
    return review.user.user_type === filter
  })

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sort) {
      case "highest":
        return (b.effectiveness_out_of_ten || 0) - (a.effectiveness_out_of_ten || 0)
      case "lowest":
        return (a.effectiveness_out_of_ten || 0) - (b.effectiveness_out_of_ten || 0)
      case "helpful":
        return (b.helpful_count || 0) - (a.helpful_count || 0)
      case "recent":
      default:
        // Handle potential null created_at values
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
        return bDate - aDate
    }
  })

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await markRatingAsHelpfulAction(reviewId)

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId ? { ...review, helpful_count: (review.helpful_count || 0) + 1 } : review,
        ),
      )

      toast({
        title: "Marked as helpful",
        description: "Thank you for your feedback",
      })
    } catch (error) {
      console.error("Error marking review as helpful:", error)
      toast({
        title: "Error",
        description: "There was an error marking this review as helpful",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
          <div>
            <StarRating rating={averageRating} readOnly />
            <div className="text-sm text-muted-foreground mt-1">
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="patient">Patients Only</SelectItem>
              <SelectItem value="doctor">Doctors Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(value: any) => setSort(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedReviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No reviews found with the selected filters.</div>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 rounded-full p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {`${review.user.first_name || ''} ${review.user.last_name || ''}`.trim() || "Anonymous User"}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="capitalize">{review.user.user_type}</span>
                        <span>•</span>
                        <span>{review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) : 'Unknown date'}</span>
                      </div>
                    </div>
                  </div>
                  <StarRating rating={review.effectiveness_out_of_ten || 0} readOnly size="sm" />
                </div>

                {review.review && <div className="mt-3">{review.review}</div>}

                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleMarkHelpful(review.id)} className="text-xs">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Helpful ({review.helpful_count})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
