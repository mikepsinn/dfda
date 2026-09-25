import { StarRating } from "@/components/ui/star-rating"

interface TreatmentRatingSummaryProps {
  averageRating: number
  totalReviews: number
  className?: string
}

export function TreatmentRatingSummary({ averageRating, totalReviews, className }: TreatmentRatingSummaryProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <StarRating rating={averageRating} readOnly />
        <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">
          ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
        </span>
      </div>
    </div>
  )
}

