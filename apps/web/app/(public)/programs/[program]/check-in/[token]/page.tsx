import type { Metadata } from "next"
import Link from "next/link"
import { ProgramValuesForm } from "@/components/programs/ProgramValuesForm"
import { recordCheckInAction } from "@/lib/actions/programs"
import { adminDb } from "@/lib/db"
import { findCheckIn } from "@/lib/programs/check-in"
import { requireCurrentProgram } from "@/lib/programs/current"
import { valueFields } from "@/lib/programs/fields"
import { formatDate } from "@/lib/programs/format"
import { preferredUnits, unitChoices } from "@/lib/programs/units"

export const metadata: Metadata = { title: "Your check-in", robots: { index: false, follow: false } }

/**
 * The day's check-in from a check-in email (lib/programs/check-in.ts),
 * without a sign-in. The button that the member tapped in the email is
 * chosen already; nothing is saved until they save. It shows no values.
 */
export default async function CheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ program: string; token: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ program: programSlug, token }, query] = await Promise.all([params, searchParams])
  const { instance, program } = await requireCurrentProgram(programSlug)
  const checkIn = await findCheckIn(token)
  const programHref = `/programs/${program.slug}/me`

  if (!checkIn || checkIn.program.id !== program.id) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <p className="text-sm font-medium text-primary">{instance.name}</p>
        <h1 className="text-3xl font-bold tracking-tight">This link is too old</h1>
        <p className="text-muted-foreground">
          A check-in link works for 3 days. Sign in to record your day on your program page.
        </p>
        <Link href={programHref} className="font-medium text-primary underline">
          Open your program
        </Link>
      </div>
    )
  }

  // The link is the permission to this member's check-in, so their units are read on the server.
  const units = await unitChoices(checkIn.items)
  const preferred = await preferredUnits(adminDb, checkIn.userId, checkIn.items, units)

  // The answer from the email: one value, which the page shows as chosen.
  const initialValues: Record<string, number> = {}
  for (const item of checkIn.items) {
    const value = Number(query[`value-${item.id}`])
    if (typeof query[`value-${item.id}`] === "string" && Number.isFinite(value)) initialValues[item.id] = value
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">{instance.name}</p>
        <h1 className="text-3xl font-bold tracking-tight">Your check-in</h1>
        <p className="text-muted-foreground">
          {program.name}, {formatDate(new Date(`${checkIn.day}T12:00:00.000Z`))}.
        </p>
      </header>
      <section aria-label="Check-in" className="surface-raised rounded-xl border p-6">
        <ProgramValuesForm
          action={recordCheckInAction.bind(null, token)}
          fields={valueFields(checkIn.items, units, preferred)}
          defaultDate={checkIn.day}
          dateLabel="Date"
          submitLabel="Save"
          fixedDate
          initialValues={initialValues}
        />
      </section>
      <p className="text-sm text-muted-foreground">
        To see your results, or to change your reminders,{" "}
        <Link href={programHref} className="font-medium text-primary underline">
          open your program
        </Link>
        .
      </p>
    </div>
  )
}
