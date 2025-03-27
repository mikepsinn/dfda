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
      trial_id,
      trials:trial_id (
        name,
        sponsor_name,
        current_milestone,
        milestone_due_date,
        refund_amount,
        progress
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .eq("data_submission_required", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // If no active trial found that requires data submission, redirect to dashboard
  if (!enrollment) {
    redirect("/patient/dashboard")
  }

  const trialData = {
    id: enrollment.trial_id,
    name: Array.isArray((enrollment.trials as any)) ? (enrollment.trials as any)[0].name : (enrollment.trials as any).name,
    sponsor: Array.isArray((enrollment.trials as any)) ? (enrollment.trials as any)[0].sponsor_name : (enrollment.trials as any).sponsor_name,
    currentMilestone: Array.isArray((enrollment.trials as any)) ? (enrollment.trials as any)[0].current_milestone : (enrollment.trials as any).current_milestone,
    dueDate: new Date(Array.isArray((enrollment.trials as any)) ? (enrollment.trials as any)[0].milestone_due_date : (enrollment.trials as any).milestone_due_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    refundAmount: Array.isArray((enrollment.trials as any)) ? (enrollment.trials as any)[0].refund_amount : (enrollment.trials as any).refund_amount,
    progress: Array.isArray((enrollment.trials as any)) ? (enrollment.trials as any)[0].progress : (enrollment.trials as any).progress,
    enrollmentId: enrollment.id,
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


