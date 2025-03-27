import type { Metadata } from "next"
import { getServerUser } from "@/lib/server-auth"
import { createServerSupabaseClient } from "@/lib/supabase"
import { SponsorHeader } from "./components/sponsor-header"
import { SponsorStats } from "./components/sponsor-stats"
import { TrialEnrollment } from "./components/trial-enrollment"
import { RecentActivity } from "./components/recent-activity"
import { TrialManagement } from "./components/trial-management"

export const metadata: Metadata = {
  title: "Sponsor Dashboard | FDA v2",
  description: "Manage your clinical trials and monitor enrollment progress",
}

export default async function SponsorDashboard() {
  const user = await getServerUser()
  const supabase = createServerSupabaseClient()

  // Fetch sponsor profile data
  const { data: sponsorProfile } = await supabase.from("users").select("*").eq("id", user?.id).single()

  // In a real app, we would fetch this data from the database
  // For now, we'll use mock data similar to what was in the client component

  // Mock sponsor data
  const sponsorData = {
    name: sponsorProfile?.name || "Innovative Therapeutics Inc.",
    activeTrials: [
      {
        id: 1,
        name: "Efficacy of Treatment A for Type 2 Diabetes",
        status: "Recruiting",
        progress: 68,
        enrolled: 342,
        target: 500,
        startDate: "Jan 15, 2025",
        endDate: "Jul 15, 2025",
      },
      {
        id: 2,
        name: "Comparative Study of Treatments B and C for Rheumatoid Arthritis",
        status: "Recruiting",
        progress: 45,
        enrolled: 135,
        target: 300,
        startDate: "Feb 1, 2025",
        endDate: "Aug 1, 2025",
      },
    ],
    completedTrials: [
      {
        id: 3,
        name: "Safety Study of Treatment D for Hypertension",
        status: "Completed",
        enrolled: 250,
        target: 250,
        startDate: "Sep 10, 2024",
        endDate: "Dec 10, 2024",
        results: "Positive efficacy, minimal side effects",
      },
    ],
    pendingApproval: [
      {
        id: 4,
        name: "Novel Therapy for Depression",
        status: "Pending Approval",
        submittedDate: "Mar 1, 2025",
      },
    ],
    recentActivity: [
      {
        type: "enrollment",
        trial: "Efficacy of Treatment A for Type 2 Diabetes",
        date: "Mar 4, 2025",
        description: "5 new participants enrolled",
      },
      {
        type: "data",
        trial: "Comparative Study of Treatments B and C for Rheumatoid Arthritis",
        date: "Mar 3, 2025",
        description: "15 participants submitted 4-week follow-up data",
      },
      {
        type: "milestone",
        trial: "Efficacy of Treatment A for Type 2 Diabetes",
        date: "Mar 1, 2025",
        description: "Reached 300+ participants milestone",
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <SponsorHeader name={sponsorData.name} />

            <div className="grid gap-4 md:grid-cols-3">
              <SponsorStats
                activeTrials={sponsorData.activeTrials.length}
                totalParticipants={sponsorData.activeTrials.reduce((sum, trial) => sum + trial.enrolled, 0)}
                pendingApproval={sponsorData.pendingApproval.length}
              />
            </div>

            <TrialEnrollment trials={sponsorData.activeTrials} />

            <RecentActivity activities={sponsorData.recentActivity as any} />

            <TrialManagement
              activeTrials={sponsorData.activeTrials}
              completedTrials={sponsorData.completedTrials}
              pendingApproval={sponsorData.pendingApproval as any}
            />
          </div>
        </main>
      </div>
    </div>
  )
}


