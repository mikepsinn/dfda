import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getServerUser } from "@/lib/server-auth"
import type { Database } from "@/lib/database.types"
import { TrialHeader } from "./components/trial-header"
import { TrialContent } from "./components/trial-content"
import { TrialActions } from "./components/trial-actions"
import { getTrialForMetadataAction, getTrialDetailsAction } from "@/lib/actions/trials"
import { getTrialEnrollmentStatusAction } from "@/lib/actions/trial-enrollments"

interface TrialDetailsPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: TrialDetailsPageProps): Promise<Metadata> {
  const trial = await getTrialForMetadataAction(params.id)

  if (!trial) {
    return {
      title: "Trial Not Found",
    }
  }

  return {
    title: trial.title,
    description: trial.description,
  }
}

export default async function TrialDetailsPage({ params }: TrialDetailsPageProps) {
  const user = await getServerUser()

  // Fetch trial data
  const trial = await getTrialDetailsAction(params.id)

  if (!trial) {
    notFound()
  }

  // Check if user is enrolled
  let enrollment: Database["public"]["Tables"]["trial_enrollments"]["Row"] | null = null
  if (user?.id) {
    enrollment = await getTrialEnrollmentStatusAction(params.id, user.id)
  }

  // For demo purposes, let's create some mock data for the trial details
  // In a real app, this would come from the database
  const trialDetails = {
    ...trial,
    eligibility: [
      "Age 18-65 years",
      "Diagnosed with condition for at least 6 months",
      "No current use of competing medications",
      "No history of specific contraindicated conditions",
    ],
    procedures: [
      "Initial screening and baseline assessment",
      "Randomized assignment to treatment or control group",
      "Weekly medication administration",
      "Bi-weekly follow-up assessments",
      "Final evaluation after 12 weeks",
    ],
    locations: [
      {
        name: "Main Research Hospital",
        address: "123 Medical Center Dr, Research City, CA",
        remote: false,
      },
      {
        name: "Community Clinic East",
        address: "456 Health Blvd, Eastside, CA",
        remote: false,
      },
      {
        name: "Telemedicine Option",
        address: "Available for qualified participants",
        remote: true,
      },
    ],
    timeline: {
      enrollment: "Ongoing until December 2025",
      duration: "12 weeks per participant",
      followUp: "6 months post-treatment",
    },
    compensation: {
      amount: "$50 per visit",
      details: "Additional $200 upon study completion",
    },
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <TrialHeader trial={trialDetails} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2">
          <TrialContent trial={trialDetails} />
        </div>

        <div className="md:col-span-1">
          <TrialActions trialId={params.id} isEnrolled={!!enrollment} userId={user?.id} />
        </div>
      </div>
    </div>
  )
}

