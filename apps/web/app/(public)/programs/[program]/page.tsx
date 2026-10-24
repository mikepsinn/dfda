import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BarChart3, ClipboardList, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { dbAs } from "@/lib/db"
import { joinProgramAction } from "@/lib/actions/programs"
import { requireCurrentProgram } from "@/lib/programs/current"
import { getServerUser } from "@/lib/server-auth"

export async function generateMetadata({ params }: { params: Promise<{ program: string }> }): Promise<Metadata> {
  const { program } = await requireCurrentProgram((await params).program)
  return { title: program.name, description: program.summary ?? undefined }
}

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ program: string }>
  searchParams: Promise<{ left?: string; error?: string }>
}) {
  const [{ program: programSlug }, query] = await Promise.all([params, searchParams])
  const [{ instance, program }, user] = await Promise.all([requireCurrentProgram(programSlug), getServerUser()])
  const enrolled = user
    ? Boolean(
        await dbAs(user).program_enrollments.findUnique({
          where: { program_id_user_id: { program_id: program.id, user_id: user.id } },
          select: { id: true },
        }),
      )
    : false
  const doses = program.items.filter((item) => item.kind === "dose")
  const checkIns = program.items.filter((item) => item.kind === "check_in")
  const labs = program.items.filter((item) => item.kind === "lab")

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">{instance.name}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{program.name}</h1>
        {program.summary && <p className="text-lg text-muted-foreground">{program.summary}</p>}
        {query.left && <p role="status" className="font-medium">You left the program. Your own records stay in your account.</p>}
        {query.error && <p role="alert" className="font-medium text-destructive">Could not join the program. Try again.</p>}
        <div className="pt-2">
          {enrolled ? (
            <Button asChild size="lg" className="gap-1">
              <Link href={`/programs/${program.slug}/me`}>
                Open your program <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <form action={joinProgramAction.bind(null, program.id)} className="space-y-4">
              {program.careTeamReview ? (
                <p className="max-w-xl text-sm">
                  In this program, {instance.name}&rsquo;s care team adds and reviews your biomarker reports. When you
                  join, its clinicians see your name, your email, your start date, your reports and what you log in the
                  program. To stop, leave the program.
                </p>
              ) : (
                <label className="flex max-w-xl items-start gap-3 text-sm">
                  <input type="checkbox" name="share" className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
                  <span>
                    Share my biomarker reports with {instance.name}&rsquo;s care team, so that a clinician can review them.
                    You can stop sharing at any time.
                  </span>
                </label>
              )}
              <Button type="submit" size="lg" className="gap-1">
                Join the program <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </header>

      <section aria-labelledby="do-heading" className="space-y-3">
        <h2 id="do-heading" className="flex items-center gap-2 text-xl font-semibold">
          <ClipboardList aria-hidden="true" className="h-5 w-5 text-primary" /> What you do
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          {doses.map((item) => (
            <li key={item.id}>
              Log your {item.name} dose ({item.unit}), {item.frequency}.
            </li>
          ))}
          {checkIns.length > 0 && (
            <li>
              Check in on{" "}
              {checkIns.map((item, index) => (
                <span key={item.id}>
                  {index > 0 && (index === checkIns.length - 1 ? " and " : ", ")}
                  {item.name.toLowerCase()} ({item.unit}, {item.frequency})
                </span>
              ))}
              .
            </li>
          )}
          {labs.length > 0 && (
            <li>
              Enter your lab results for {labs.map((item) => item.name).join(", ")}: once from before you start, and
              again at week {program.followUpWeeks}.
            </li>
          )}
        </ul>
      </section>

      <section aria-labelledby="get-heading" className="space-y-3">
        <h2 id="get-heading" className="flex items-center gap-2 text-xl font-semibold">
          <BarChart3 aria-hidden="true" className="h-5 w-5 text-primary" /> What you get
        </h2>
        <p>
          A before/after report: each measure at the start and now, and whether it improved.{" "}
          <Link href={`/programs/${program.slug}/example`} className="font-medium text-primary underline">
            See an example report
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="sees-heading" className="space-y-3">
        <h2 id="sees-heading" className="flex items-center gap-2 text-xl font-semibold">
          <ShieldCheck aria-hidden="true" className="h-5 w-5 text-primary" /> What {instance.name} sees
        </h2>
        <p>
          Totals only, such as how many people improved on each measure. {instance.name} does not see your own values.
          {program.careTeamReview
            ? " The clinicians of its care team see your name, your biomarker reports and what you log in the program, and review each report. You can leave the program at any time."
            : " If you share your biomarker reports, the clinicians of its care team see those reports and your name. You can stop sharing or leave the program at any time."}
        </p>
      </section>
    </div>
  )
}
