import { Suspense } from 'react'
import { TreatmentHeader } from './components/treatment-header'
import { TreatmentDetails } from './components/treatment-details'
import { TreatmentReviews } from './components/treatment-reviews'
import { getTreatmentByIdAction } from '@/app/actions/treatments'
import { getAverageTreatmentRatingAction, getTreatmentRatingsAction, getUserTreatmentRatingAction } from '@/app/actions/treatment-ratings'
import { getServerUser } from '@/lib/server-auth'

export default async function TreatmentPage({ params }: { params: { id: string } }) {
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
  const ratings = await getTreatmentRatingsAction(treatment.id, conditionId)
  const stats = await getAverageTreatmentRatingAction(treatment.id, conditionId)
  const averageRating = stats?.avg_effectiveness || 0
  const totalReviews = stats?.total_ratings || 0

  // Get user's rating if logged in
  const userRating = user ? await getUserTreatmentRatingAction(user.id, treatment.id, conditionId) : null

  return (
    <main className="container py-6">
      <Suspense fallback={<div>Loading...</div>}>
        <TreatmentHeader 
          treatment={treatment}
          conditionId={conditionId}
          averageRating={averageRating}
          totalReviews={totalReviews}
        />
        <TreatmentDetails 
          treatment={treatment}
          conditionId={conditionId}
        />
        <TreatmentReviews 
          treatmentId={treatment.id}
          conditionId={conditionId}
          ratings={ratings}
          averageRating={averageRating}
          totalReviews={totalReviews}
          userRating={userRating}
          userId={user?.id}
          userType="patient"
          isLoggedIn={!!user}
        />
      </Suspense>
    </main>
  )
}
