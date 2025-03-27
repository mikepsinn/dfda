import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase"
import { getServerUser } from "@/lib/server-auth"
import { getTreatmentAverageRating, getTreatmentRatings, getUserTreatmentRating } from "@/lib/api/treatment-ratings"
import { TreatmentHeader } from "./components/treatment-header"
import { TreatmentDetails } from "./components/treatment-details"
import { TreatmentReviews } from "./components/treatment-reviews"

interface TreatmentPageProps {
  params: {
    id: string
  }
  searchParams: {
    condition?: string
  }
}

export async function generateMetadata({ params, searchParams }: TreatmentPageProps): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: treatment } = await supabase.from("treatments").select("*").eq("id", params.id).single()

  if (!treatment) {
    return {
      title: "Treatment Not Found | FDA v2",
      description: "The requested treatment could not be found.",
    }
  }

  return {
    title: `${treatment.name} | FDA v2`,
    description: treatment.description || "View details about this treatment and patient reviews.",
  }
}

export default async function TreatmentPage({ params, searchParams }: TreatmentPageProps) {
  const user = await getServerUser()
  const supabase = createServerClient()

  // Get condition ID if provided in search params
  let conditionId = searchParams.condition

  // Fetch treatment data
  const { data: treatment, error } = await supabase
    .from("treatments")
    .select(`
      *,
      conditions:treatment_conditions(condition_id, conditions(id, name))
    `)
    .eq("id", params.id)
    .single()

  if (error || !treatment) {
    notFound()
  }

  // If condition not specified in URL, use the first associated condition
  if (!conditionId && treatment.conditions && treatment.conditions.length > 0) {
    conditionId = treatment.conditions[0].conditions?.id
  }

  // If we still don't have a condition ID, we can't show ratings
  if (!conditionId) {
    notFound()
  }

  // Get treatment ratings
  const ratings = await getTreatmentRatings(params.id, conditionId)
  const { average: averageRating, count: totalReviews } = await getTreatmentAverageRating(params.id, conditionId)

  // Get user's existing rating if logged in
  let userRating = null
  if (user) {
    userRating = await getUserTreatmentRating(user.id, params.id, conditionId)
  }

  // Get user type (patient or doctor)
  let userType: "patient" | "doctor" = "patient"
  if (user) {
    const { data: userProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (userProfile && userProfile.role === "doctor") {
      userType = "doctor"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TreatmentHeader
        treatment={treatment}
        conditionId={conditionId}
        averageRating={averageRating}
        totalReviews={totalReviews}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <TreatmentDetails treatment={treatment} conditionId={conditionId} />
        </div>

        <div className="lg:col-span-1">
          <TreatmentReviews
            treatmentId={params.id}
            conditionId={conditionId}
            ratings={ratings}
            averageRating={averageRating}
            totalReviews={totalReviews}
            userRating={userRating}
            userId={user?.id}
            userType={userType}
            isLoggedIn={!!user}
          />
        </div>
      </div>
    </div>
  )
}

