import { getServerUser } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "./dashboard-header"
import { EnrolledTrials } from "./enrolled-trials"
import { RecommendedTrials } from "./recommended-trials"
import { HealthMetrics } from "./health-metrics"

export default async function PatientDashboard() {
  const user = await getServerUser()
  const supabase = await createClient()

  // Fetch user profile data
  const { data: profile } = await supabase.from("users").select("*").eq("id", user?.id).single()

  // Fetch enrolled trials
  const { data: enrollments } = await supabase
    .from("trial_enrollments")
    .select(`
      id,
      status,
      enrollment_date,
      created_at,
      updated_at,
      deleted_at,
      doctor_id,
      patient_id,
      trial_id,
      notes,
      completion_date,
      trials:trial_id (
        id,
        title,
        description,
        status,
        treatment_id,
        condition_id,
        treatments:treatment_id (
          id,
          title,
          treatment_type,
          manufacturer
        ),
        conditions:condition_id (
          id,
          title,
          icd_code
        )
      )
    `)
    .eq("patient_id", user?.id)

  // Fetch recommended trials based on user's conditions
  const { data: recommendations } = await supabase
    .from("trials")
    .select(`
      id,
      title,
      description,
      status,
      treatment_id,
      condition_id,
      treatments:treatment_id (
        id,
        title,
        treatment_type,
        manufacturer
      ),
      conditions:condition_id (
        id,
        title,
        icd_code
      )
    `)
    .eq("status", "active")
    .limit(5)

  return (
    <main className="flex-1 py-6 md:py-10">
      <div className="container">
        <DashboardHeader user={profile} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="md:col-span-2 space-y-6">
            <EnrolledTrials enrollments={enrollments || []} />
            <RecommendedTrials trials={recommendations || []} />
          </div>

          <div className="space-y-6">
            <HealthMetrics userId={user?.id} />
          </div>
        </div>
      </div>
    </main>
  )
}

