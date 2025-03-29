import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase"
import { getServerUser } from "@/lib/server-auth"
import { getAverageTreatmentRatingAction, getTreatmentRatingsAction, getUserTreatmentRatingAction } from "@/app/actions/treatment-ratings"
import { TreatmentHeader } from "./components/treatment-header"
import { TreatmentDetails } from "./components/treatment-details"
import { TreatmentReviews } from "./components/treatment-reviews"
import type { Database } from "@/lib/database.types"

type TreatmentRating = Database['public']['Tables']['treatment_ratings']['Row']

interface TreatmentPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: TreatmentPageProps): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: treatment } = await supabase
    .from("treatments")
    .select("title, description")
    .eq("id", params.id)
    .single()

  if (!treatment) {
    return {
      title: "Treatment Not Found | FDA v2",
      description: "The requested treatment could not be found.",
    }
  }

  const metadata: Metadata = {
    title: `${treatment.title} | FDA v2`,
    description: treatment.description || "View details about this treatment and patient reviews.",
  }

  return metadata
}

export default async function TreatmentPage({ params }: TreatmentPageProps) {
  const user = await getServerUser()
  const supabase = createServerClient()

  let conditionId = ""

  // Fetch treatment data
  const { data: treatment, error } = await supabase
    .from("treatments")
    .select("*, conditions (*)") // Also fetch related condition data
    .eq("id", params.id)
    .single()

  if (error) {
    // logger.error(`Error fetching treatment ${params.id}:`, error)
    notFound()
  }
  if (!treatment) {
    notFound()
  }

  // Set conditionId from the fetched treatment data
  // Check if conditions array exists and has elements
  if (treatment.conditions && treatment.conditions.length > 0 && treatment.conditions[0]) {
    conditionId = treatment.conditions[0].id ?? "";
  } else {
    // Handle cases where condition might not be linked or fetched correctly
    // logger.error(`Treatment ${params.id} does not have a linked condition or condition data is missing.`)
    // Depending on requirements, you might show an error, default content, or still proceed without condition-specific features.
    // For now, let's allow proceeding but log the error. Condition-specific components might need internal checks.
  }

  // Fetch user profile data (commented out for now to fix lint error)
  // let profileError = null
  // let profile = null
  // if (user) {
  //   const { data: fetchedProfile, error: fetchedProfileError } = await supabase
  //     .from('profiles')
  //     .select('role') // Select only needed fields
  //     .eq('id', user.id)
  //     .single()
  //   profile = fetchedProfile
  //   profileError = fetchedProfileError
  // }

  // if (profileError) {
  //   // logger.error(`Error fetching profile for user ${user?.id}:`, profileError)
  //   // Decide how to handle profile error - maybe show treatment anyway?
  // }

  // Get treatment ratings
  const ratings = await getTreatmentRatingsAction(params.id, conditionId)
  const stats = await getAverageTreatmentRatingAction(params.id, conditionId)
  const averageRating = stats.avg_effectiveness
  const totalReviews = stats.total_ratings

  // Get user's existing rating if logged in
  let userRating: TreatmentRating | null = null
  if (user) {
    const tempRating = await getUserTreatmentRatingAction(user.id, params.id, conditionId)
    userRating = tempRating
  }

  // Get user type (patient or doctor)
  const userType: "patient" | "doctor" = "patient"
  // if (user) {
  //   const { data: userProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  //   if (userProfile && userProfile.role === "doctor") {
  //     userType = "doctor"
  //   }
  // }

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
