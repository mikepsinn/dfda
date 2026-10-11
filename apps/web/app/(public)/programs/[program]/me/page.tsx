import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProgramReport } from "@/components/programs/ProgramReport"
import { ProgramValuesForm, type ValueField } from "@/components/programs/ProgramValuesForm"
import { leaveProgramAction, recordProgramValuesAction } from "@/lib/actions/programs"
import { SCALE_RANGES } from "@/lib/programs/config"
import { requireCurrentProgram } from "@/lib/programs/current"
import { personalReport, type ProgramItem } from "@/lib/programs/data"
import { formatDate } from "@/lib/programs/format"
import { CHECK_IN_REMINDER_TIME, DOSE_REMINDER_TIME } from "@/lib/programs/manage"
import { getServerUser } from "@/lib/server-auth"

export const metadata: Metadata = { title: "Your program" }

const DAY = 86_400_000

function field(item: ProgramItem): ValueField {
  const range = SCALE_RANGES[item.unitId]
  return { id: item.id, name: item.name, unit: item.unit, defaultValue: item.defaultValue, min: range?.[0], max: range?.[1] }
}

export default async function YourProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ program: string }>
  searchParams: Promise<{ joined?: string }>
}) {
  const [{ program: programSlug }, query] = await Promise.all([params, searchParams])
  const { instance, program } = await requireCurrentProgram(programSlug)
  const user = await getServerUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/programs/${program.slug}/me`)}`)
  const report = await personalReport(user, program)
  if (!report) redirect(`/programs/${program.slug}`)

  const today = new Date().toISOString().slice(0, 10)
  const day = Math.floor((Date.now() - report.startedAt.getTime()) / DAY) + 1
  const followUpDays = program.followUpWeeks * 7
  const todayItems = program.items.filter((item) => item.kind !== "lab")
  const labItems = program.items.filter((item) => item.kind === "lab")

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">{instance.name}</p>
        <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
        <p className="text-muted-foreground">
          {day <= followUpDays ? `Day ${day} of ${followUpDays}.` : "Your follow-up is due."} Follow-up on{" "}
          {formatDate(report.followUpAt)}.
        </p>
        {query.joined && (
          <p role="status" className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              You joined. A reminder schedule is set for each dose ({DOSE_REMINDER_TIME}) and check-in (
              {CHECK_IN_REMINDER_TIME}). You can change the times on{" "}
              <Link href="/patient/reminders" className="font-medium underline">
                your reminders page
              </Link>
              .
            </span>
          </p>
        )}
      </header>

      {todayItems.length > 0 && (
        <section aria-labelledby="today-heading" className="space-y-4 rounded-xl border p-6">
          <h2 id="today-heading" className="text-xl font-semibold">
            Record a day
          </h2>
          <ProgramValuesForm
            action={recordProgramValuesAction.bind(null, program.id, "today")}
            fields={todayItems.map(field)}
            defaultDate={today}
            dateLabel="Date"
            submitLabel="Save"
          />
        </section>
      )}

      {labItems.length > 0 && (
        <section aria-labelledby="labs-heading" className="space-y-4 rounded-xl border p-6">
          <div className="space-y-1">
            <h2 id="labs-heading" className="text-xl font-semibold">
              Lab results
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter results from before you started (up to {formatDate(new Date(report.startedAt.getTime() + 7 * DAY))}),
              and again from around {formatDate(report.followUpAt)}. Use the date of the blood draw.
            </p>
          </div>
          <ProgramValuesForm
            action={recordProgramValuesAction.bind(null, program.id, "lab")}
            fields={labItems.map(field)}
            defaultDate={today}
            dateLabel="Date of the blood draw"
            submitLabel="Save lab results"
          />
        </section>
      )}

      <ProgramReport report={report} />

      <section aria-label="More" className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/patient/reminders" className="font-medium text-primary underline">
            Your reminders
          </Link>
          <Link href={`/programs/${program.slug}/example`} className="font-medium text-primary underline">
            Example report
          </Link>
        </div>
        <form action={leaveProgramAction.bind(null, program.id)}>
          <Button type="submit" variant="outline" size="sm">
            Leave the program
          </Button>
        </form>
      </section>
    </div>
  )
}
