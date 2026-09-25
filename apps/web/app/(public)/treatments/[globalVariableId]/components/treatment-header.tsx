import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { TreatmentRatingSummary } from "@/components/treatment-rating-summary"

interface TreatmentHeaderProps {
  treatment: any
  conditionId: string
  averageRating: number
  totalReviews: number
}

export function TreatmentHeader({ treatment, conditionId, averageRating, totalReviews }: TreatmentHeaderProps) {
  // Find the condition name
  const conditionObj = treatment.conditions?.find(
    (c: any) => c.condition_id === conditionId || c.conditions?.id === conditionId,
  )
  const conditionName = conditionObj?.conditions?.name || "Unknown Condition"

  return (
    <div>
      <Link
        href={`/patient/find-trials?condition=${conditionId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {conditionName} treatments
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{treatment.name}</h1>
          <p className="text-muted-foreground mt-1">Treatment for {conditionName}</p>
        </div>

        <TreatmentRatingSummary averageRating={averageRating} totalReviews={totalReviews} />
      </div>
    </div>
  )
}

