import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AddTreatmentDialog } from "./components/add-treatment-dialog"
import { getPatientConditionsAction } from '@/app/actions/patient-conditions'
import type { Database } from "@/lib/database.types"
import { TreatmentsClient } from "./components/treatments-client"

// Define PatientCondition type alias
type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"];

export default async function TreatmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch conditions directly, handle potential errors with try/catch
  let conditions: PatientCondition[] = []
  let conditionsError: Error | null = null
  try {
    conditions = await getPatientConditionsAction(user.id)
  } catch (error) {
    conditionsError = error instanceof Error ? error : new Error('Failed to fetch conditions')
    // Log the error or handle it as needed
    console.error("Error fetching conditions in page:", conditionsError)
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Treatments</h1>
          <p className="text-muted-foreground">Manage your treatments, rate effectiveness, and track side effects</p>
        </div>
        <div className="flex gap-4">
          <AddTreatmentDialog userId={user.id}/>
        </div>
      </div>

      {/* Render the client component, passing server-fetched data */}
      <TreatmentsClient 
        userId={user.id} 
        initialConditions={conditions} 
        conditionsError={conditionsError}
      />
    </div>
  )
} 