import { getTreatmentByIdAction } from "@/lib/actions/treatments"
// import { getTreatmentReviewsAction } from "@/app/actions/treatment-ratings"
// import ReportSideEffectDialog from "@/components/report-side-effect/ReportSideEffectDialog"
// import { TreatmentNotFound } from "@/components/treatment/TreatmentNotFound"
// import { TreatmentPageContent } from "@/components/treatment/TreatmentPageContent"
import { Separator } from "@/components/ui/separator"
// import { cookies } from "next/headers"

// import { createClient } from "@/lib/supabase/server"
// import { reportSideEffectAction } from "@/app/actions/reported-side-effects"

export default async function TreatmentPage({ params }: { params: { id: string } }) {
  // const cookieStore = cookies()
  // const supabase = createClient(cookieStore)

  // const {
  //  data: { user },
  // } = await supabase.auth.getUser()

  // const treatmentId = Number(params.id) // Use params.id directly

  // if (!params.id) { // Check params.id directly
  //  return <TreatmentNotFound />
  // }

  const treatment = await getTreatmentByIdAction(params.id)
  // const conditionId = treatment?.condition_id // Optional chaining for potential null

  if (!treatment) {
    // return <TreatmentNotFound /> // Need to handle not found case, maybe render a simple message
    return <div>Treatment not found.</div>
  }

  // const reviewsResult = await getTreatmentReviewsAction({ treatmentId: params.id }) // Removed reviews logic
  // const reviews = reviewsResult.data ?? [] // Removed reviews logic

  // const sideEffectsResult = await getReportedSideEffectsAction({ treatmentId: params.id })
  // const sideEffects = sideEffectsResult.data ?? []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Placeholder content - Need to replace with actual component or structure */}
      <h1>{treatment.name}</h1>
      <Separator className="my-4" />
      <p>{treatment.description}</p>
      {/* <TreatmentPageContent treatment={treatment} reviews={reviews} /> */}
      {/* Render ReportSideEffectDialog if needed */}
    </div>
  )
}
