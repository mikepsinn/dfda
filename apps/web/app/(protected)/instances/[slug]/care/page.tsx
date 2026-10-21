import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { reviewLabel } from "@/components/care-team/ReviewStatus"
import { careTeamPatients, requireCareTeam } from "@/lib/care-team/data"
import { programWeek } from "@/lib/care-team/format"
import { formatDate } from "@/lib/programs/format"

export const metadata: Metadata = { title: "Care team" }

/** The care team's patients: the people who share their biomarker reports with it. */
export default async function CareTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { user, instance } = await requireCareTeam(slug)
  const patients = await careTeamPatients(user, instance)

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">{instance.name} care team</p>
        <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
        <p className="text-muted-foreground">
          The people who share their biomarker reports with the care team. Other people in {instance.name}&rsquo;s
          programs do not appear here.
        </p>
      </header>

      {patients.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">Nobody shares their reports yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th scope="col" className="p-3 font-medium">Patient</th>
                <th scope="col" className="p-3 font-medium">Program</th>
                <th scope="col" className="p-3 font-medium">Shared since</th>
                <th scope="col" className="p-3 font-medium">Latest report</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {patients.map((patient) => {
                const latest = patient.reports[0]
                return (
                  <tr key={patient.enrollmentId}>
                    <th scope="row" className="p-3 font-medium">
                      <Link href={`/instances/${instance.slug}/care/${patient.enrollmentId}`} className="text-primary underline">
                        {patient.name}
                      </Link>
                      <span className="block font-normal text-muted-foreground">{patient.email}</span>
                    </th>
                    <td className="p-3">
                      {patient.program.name}
                      <span className="block text-muted-foreground">
                        {programWeek(patient.startedAt, patient.program.followUpWeeks)}
                      </span>
                    </td>
                    <td className="p-3">{formatDate(patient.sharedAt)}</td>
                    <td className="p-3">
                      {latest ? (
                        <>
                          <Badge variant={latest.reviewedAt ? "secondary" : "outline"}>{reviewLabel(latest)}</Badge>
                          <span className="mt-1 block text-muted-foreground">{formatDate(latest.reportDate)}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">No report yet</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
