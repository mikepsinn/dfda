import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { reviewLabel } from "@/components/care-team/ReviewStatus"
import { TonePill } from "@/components/status-tone"
import { careTeamPatients, requireCareTeam } from "@/lib/care-team/data"
import { programWeek } from "@/lib/care-team/format"
import { attentionOrder, type QueueEntry } from "@/lib/care-team/queue"
import { formatDate } from "@/lib/programs/format"

export const metadata: Metadata = { title: "Care team" }

const reports = (count: number) => `${count} ${count === 1 ? "report" : "reports"}`

/** What the patient needs from the care team now, as the queue shows it. */
function QueueStatus({ entry }: { entry: QueueEntry }) {
  if (entry.state === "review") {
    return (
      <TonePill tone="amber" className="px-2.5 py-0.5 text-xs">
        {reports(entry.waiting)} to review
      </TonePill>
    )
  }
  if (entry.state === "no-report") return <span className="text-muted-foreground">No report yet</span>
  return <Badge variant="secondary">{reviewLabel(entry.reports[0], "care-team")}</Badge>
}

/**
 * The care team's queue: the people who share their biomarker reports with
 * it, with the reports that wait for review first (lib/care-team/queue.ts).
 */
export default async function CareTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ joined?: string }>
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const { user, instance } = await requireCareTeam(slug)
  const queue = attentionOrder(await careTeamPatients(user, instance))
  const waiting = queue.reduce((sum, entry) => sum + entry.waiting, 0)

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        {query.joined && (
          <p role="status" className="flex items-center gap-2 font-medium text-primary">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" /> You are on the care team now.
          </p>
        )}
        <p className="text-sm font-medium text-primary">{instance.name} care team</p>
        <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
        <p className="text-muted-foreground">
          The people who share their biomarker reports with the care team. Other people in {instance.name}&rsquo;s
          programs do not appear here.
        </p>
      </header>

      {queue.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">Nobody shares their reports yet.</p>
      ) : (
        <section aria-labelledby="queue-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="queue-heading" className="text-xl font-semibold">
              {waiting === 0 ? "No reports to review" : `${reports(waiting)} to review`}
            </h2>
            <p className="text-sm text-muted-foreground">Reports that wait the longest come first.</p>
          </div>
          <div className="surface-raised overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3 font-medium">Patient</th>
                  <th scope="col" className="p-3 font-medium">Program</th>
                  <th scope="col" className="p-3 font-medium">Status</th>
                  <th scope="col" className="p-3 font-medium">Latest report</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {queue.map((entry) => {
                  const latest = entry.reports[0]
                  return (
                    <tr key={entry.enrollmentId}>
                      <th scope="row" className="p-3 font-medium">
                        <Link href={`/instances/${instance.slug}/care/${entry.enrollmentId}`} className="text-primary underline">
                          {entry.name}
                        </Link>
                        <span className="block font-normal text-muted-foreground">{entry.email}</span>
                      </th>
                      <td className="p-3">
                        {entry.program.name}
                        <span className="block text-muted-foreground">
                          {programWeek(entry.startedAt, entry.program.followUpWeeks)}
                        </span>
                      </td>
                      <td className="p-3">
                        <QueueStatus entry={entry} />
                      </td>
                      <td className="p-3">
                        {latest ? (
                          formatDate(latest.reportDate)
                        ) : (
                          <span className="text-muted-foreground">Shares since {formatDate(entry.sharedAt)}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
