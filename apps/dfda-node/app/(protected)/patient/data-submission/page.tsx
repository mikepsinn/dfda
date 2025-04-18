import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getServerUser } from "@/lib/server-auth"
import { DataSubmissionForm } from "./components/data-submission-form"
import { redirect } from "next/navigation"
import { Database } from "@/lib/database.types"
import { getPatientActiveEnrollmentAction } from "@/app/actions/trial-enrollments"
import { getLatestDataSubmissionAction } from "@/app/actions/data-submissions"

type Trial = Database["public"]["Tables"]["trials"]["Row"]
type DataSubmission = Database["public"]["Tables"]["data_submissions"]["Row"]
type TrialEnrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"]

interface TrialSubmissionData {
  trial: Trial
  enrollment: TrialEnrollment
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

  if (!user) {
    redirect("/login")
  }

  const enrollment = await getPatientActiveEnrollmentAction(user.id)

  if (!enrollment) {
    redirect("/patient/")
  }

  const submission = await getLatestDataSubmissionAction(enrollment.id)

  const trialData: TrialSubmissionData = {
    trial: enrollment.trial,
    enrollment: {
      id: enrollment.id,
      trial_id: enrollment.trial_id,
      patient_id: enrollment.patient_id,
      provider_id: enrollment.provider_id,
      status: enrollment.status,
      enrollment_date: enrollment.enrollment_date,
      completion_date: enrollment.completion_date,
      notes: enrollment.notes,
      created_at: enrollment.created_at,
      updated_at: enrollment.updated_at,
      deleted_at: enrollment.deleted_at
    },
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
              <Link href="/patient/" className="text-muted-foreground hover:text-foreground">
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


