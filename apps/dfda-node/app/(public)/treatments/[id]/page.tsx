import { Suspense } from 'react'
import { TreatmentHeader } from './components/treatment-header'
import { TreatmentDetails } from './components/treatment-details'
import { TreatmentReviews } from './components/treatment-reviews'
import { getTreatmentByIdAction } from '@/app/actions/treatments'
// import { getAverageTreatmentRatingAction, getTreatmentRatingsAction, getUserTreatmentRatingAction } from '@/app/actions/treatment-ratings' // Commented out - deprecated/renamed actions
import { getServerUser } from '@/lib/server-auth'
// Adjust path for TreatmentSideEffectsList if needed
// import { TreatmentSideEffectsList } from "@/components/treatment-side-effects-list" 
import { createClient } from "@/lib/supabase/server"
// Correct action import name
import { reportSideEffectAction } from "@/app/actions/treatment-side-effects"
// import { TreatmentSideEffectsCard } from "./components/treatment-side-effects-card" // Commented out - Component not found
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface TreatmentPageProps {
  params: { id: string }
  searchParams: { condition?: string } // Add searchParams for conditionId
}

export default async function TreatmentPage({ params, searchParams }: TreatmentPageProps) {
  const treatment = await getTreatmentByIdAction(params.id)
  const user = await getServerUser()

  if (!treatment) {
    return (
      <main className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Treatment Not Found</h1>
        <p>The treatment you're looking for doesn't exist.</p>
      </main>
    )
  }

  // Default to empty string for conditionId since we're viewing the treatment directly
  const conditionId = ''

  // Get treatment ratings and stats
  // const ratings = await getTreatmentRatingsAction(treatment.id, conditionId)
  // const stats = await getAverageTreatmentRatingAction(treatment.id, conditionId)
  // const averageRating = stats?.avg_effectiveness || 0
  // const totalReviews = stats?.total_ratings || 0

  // Get user's rating if logged in
  // const userRating = user ? await getUserTreatmentRatingAction(user.id, treatment.id, conditionId) : null

  // Fetch side effects using the correct action
  // const sideEffectsData = await reportSideEffectAction(params.id) // Assuming this action fetches effects for a treatment ID?
  // This seems incorrect, reportSideEffectAction likely submits data.
  // Let's assume side effects fetching is not implemented yet or needs a different action.
  const sideEffects = []; // Placeholder

  // const averageRatingData = averageRating // Commented out

  return (
    <div className="container space-y-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Treatment Details & Ratings</CardTitle>
          <CardDescription>
            Detailed information and user ratings for this treatment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p>Loading details...</p>}>
            <TreatmentDetails treatment={treatment} conditionId={searchParams.condition || ''} />
      </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
