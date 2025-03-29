import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getServerUser } from "@/lib/server-auth"
import { createServerClient } from "@/lib/supabase"
import { DataSubmissionForm } from "./components/data-submission-form"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Submit Trial Data | Decentralized FDA",
  description: "Submit your clinical trial data and track your progress in the trial.",
}

export default async function DataSubmission() {
  const user = await getServerUser()

  if (!user) {
    redirect("/login?callbackUrl=/patient/data-submission")
  }

  const supabase = createServerClient()

  // Fetch the user's active trial that requires data submission
  const { data: enrollment } = await supabase
    .from("trial_enrollments")
    .select(`
      id,
      trial:trial_id!inner (
        id,
        title,
        description,
        status,
        treatment_id,
        condition_id,
        created_at,
        updated_at,
        deleted_at,
        start_date,
        end_date,
        enrollment_target,
        current_enrollment,
        compensation
      )
    `)
    .eq("patient_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // If no active trial found that requires data submission, redirect to dashboard
  if (!enrollment) {
    redirect("/patient/dashboard")
  }

  // Create an empty submission for this enrollment
  const { data: submission } = await supabase
    .from("data_submissions")
    .insert({
      enrollment_id: enrollment.id,
      patient_id: user.id,
      status: "pending",
      data: {},
      submission_date: new Date().toISOString()
    })
    .select()
    .single()

  const trialData = {
    trial: enrollment.trial,
    submission,
    currentMilestone: "Week 4 Check-in",
    refundAmount: 50,
    progress: 33
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


