import type { Metadata } from "next"
import type { Database } from "@/lib/database.types"
import { getServerUser } from "@/lib/server-auth"
import { createServerClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { SponsorOverview } from "./components/sponsor-overview"
import { TrialEnrollment } from "./components/trial-enrollment"
import { TrialManagement } from "./components/trial-management"
import { RecentActivity } from "./components/recent-activity"

type Trial = Database["public"]["Tables"]["trials"]["Row"]

export const metadata: Metadata = {
  title: "Sponsor Dashboard | FDA v2",
  description: "Manage your clinical trials and view enrollment statistics.",
}

export default async function SponsorDashboard() {
  const user = await getServerUser()

  if (!user) {
    redirect("/login?callbackUrl=/sponsor/dashboard")
  }

  const supabase = createServerClient()

  // Get sponsor profile
  const { data: sponsorProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Get active trials
  const { data: activeTrials } = await supabase
    .from("trials")
    .select(`
      *,
      conditions (
        id,
        title,
        icd_code
      ),
      treatments (
        id,
        title,
        treatment_type,
        manufacturer
      )
    `)
    .eq("sponsor_id", user.id)
    .eq("status", "active")

  // Get completed trials
  const { data: completedTrials } = await supabase
    .from("trials")
    .select(`
      *,
      conditions (
        id,
        title,
        icd_code
      ),
      treatments (
        id,
        title,
        treatment_type,
        manufacturer
      )
    `)
    .eq("sponsor_id", user.id)
    .eq("status", "completed")

  const sponsorData = {
    name: sponsorProfile?.full_name || "Innovative Therapeutics Inc.",
    activeTrials: activeTrials || [],
    completedTrials: completedTrials || [],
    totalEnrollment: (activeTrials || []).reduce((sum, trial) => sum + (trial.current_enrollment || 0), 0),
    totalTrials: (activeTrials || []).length + (completedTrials || []).length,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-5xl space-y-8">
            <SponsorOverview
              name={sponsorData.name}
              totalTrials={sponsorData.totalTrials}
              totalEnrollment={sponsorData.totalEnrollment}
            />

            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Trial Enrollment</h2>
              <TrialEnrollment trials={sponsorData.activeTrials} />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Trial Management</h2>
              <TrialManagement
                activeTrials={sponsorData.activeTrials}
                completedTrials={sponsorData.completedTrials}
              />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Recent Activity</h2>
              <RecentActivity trials={sponsorData.activeTrials} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


