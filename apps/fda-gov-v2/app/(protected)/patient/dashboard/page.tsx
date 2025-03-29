import { getServerUser } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EnrolledTrials } from "@/components/patient/enrolled-trials"
import { PatientOverview } from "@/components/patient/patient-overview"
import { RecentActivity } from "@/components/patient/recent-activity"
import { Database } from "@/lib/database.types"
import { SupabaseClient } from "@supabase/supabase-js"

type Trial = Database["public"]["Tables"]["trials"]["Row"]
type Enrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"] & {
  trial: Trial
}

export default async function PatientDashboard() {
  const user = await getServerUser()
  const supabase = await createClient() as SupabaseClient<Database>

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single()

  const { data: enrollments } = await supabase
    .from("trial_enrollments")
    .select(`
      id,
      status,
      created_at,
      patient_id,
      trial:trials (
        id,
        title,
        description,
        status,
        sponsor_id,
        created_at
      )
    `)
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })

  const patientName = profile ? `${profile.first_name} ${profile.last_name}` : "Patient"
  const patientData = {
    name: patientName,
    enrollments: (enrollments || []) as Enrollment[],
    totalEnrollment: enrollments?.length || 0,
  }

  return (
    <div className="container space-y-8 py-8">
      <PatientOverview {...patientData} />
      <div className="grid gap-8 md:grid-cols-2">
        <EnrolledTrials enrollments={patientData.enrollments} />
        <RecentActivity activities={patientData.enrollments} />
      </div>
    </div>
  )
}

