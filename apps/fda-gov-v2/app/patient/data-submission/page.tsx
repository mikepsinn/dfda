import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getServerUser } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { DataSubmissionForm } from "./components/data-submission-form"
import { redirect } from "next/navigation"
import { Database } from "@/lib/database.types"

type Trial = Database["public"]["Tables"]["trials"]["Row"]
type DataSubmission = Database["public"]["Tables"]["data_submissions"]["Row"]

interface TrialSubmissionData {
  trial: Trial
  submission: DataSubmission | null
  currentMilestone: string
  refundAmount: number
  progress: number
}

export const metadata: Metadata = {
  title: "Submit Trial Data | Decentralized FDA",
  description: "Submit your clinical trial data and track your progress in the trial.",
}

export default async function DataSubmissionPage() {
  const user = await getServerUser()
  const supabase = await createClient()

  if (!user) {
    redirect("/login")
  }

  // Get the user's active trial enrollment
  const { data: enrollment } = await supabase
    .from("trial_enrollments")
    .select(`
      id,
      trial:trials (
        id,
        title,
        description,
        status,
        sponsor_id,
        created_at,
        updated_at,
        deleted_at,
        condition_id,
        treatment_id,
        start_date,
        end_date,
        target_enrollment,
        current_enrollment,
        phase,
        location,
        compensation,
        inclusion_criteria,
        exclusion_criteria
      )
    `)
    .eq("patient_id", user.id)
    .eq("status", "active")
    .single()

  if (!enrollment) {
    redirect("/patient/dashboard")
  }

  // Get the latest data submission for this enrollment
  const { data: submission } = await supabase
    .from("data_submissions")
    .select("*")
    .eq("enrollment_id", enrollment.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  const trialData: TrialSubmissionData = {
    trial: enrollment.trial,
    submission: submission || null,
    currentMilestone: "Week 4 Check-in", // This should come from your milestone tracking logic
    refundAmount: enrollment.trial.compensation || 0,
    progress: 33 // This should be calculated based on completed milestones
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/patient/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold">Submit Trial Data</h1>
            </div>

            <DataSubmissionForm trialData={trialData} />
          </div>
        </div>
      </main>
    </div>
  )
}


