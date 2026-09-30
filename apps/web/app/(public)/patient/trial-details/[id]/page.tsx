import type { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import { getServerUser } from "@/lib/server-auth"
import { TrialHeader } from "./components/trial-header"
import { TrialContent } from "./components/trial-content"
import { TrialActions } from "./components/trial-actions"
import { getTrialDetailsAction } from "@/lib/actions/trials"
import { getTrialEnrollmentStatusAction } from "@/lib/actions/trial-enrollments"

interface TrialDetailsPageProps {
  params: Promise<{ id: string }>
}

// Public page: visitors can read any trial that the trials access policy lets them see.
// Metadata and the page share one query per request.
const getTrial = cache(getTrialDetailsAction)

export async function generateMetadata({ params }: TrialDetailsPageProps): Promise<Metadata> {
  const trial = await getTrial((await params).id)

  if (!trial) {
    return { title: "Trial Not Found" }
  }

  return {
    title: trial.title,
    description: trial.description ?? undefined,
  }
}

export default async function TrialDetailsPage({ params }: TrialDetailsPageProps) {
  const { id } = await params
  const trial = await getTrial(id)

  if (!trial) {
    notFound()
  }

  const user = await getServerUser()
  const enrollment = user?.id ? await getTrialEnrollmentStatusAction(id, user.id) : null

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <TrialHeader trial={trial} />

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <TrialContent trial={trial} />
        </div>

        <div className="md:col-span-1">
          <TrialActions trialId={id} isEnrolled={!!enrollment} userId={user?.id} />
        </div>
      </div>
    </div>
  )
}
