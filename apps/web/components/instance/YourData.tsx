import { ShieldCheck } from "lucide-react"
import type { Program } from "@/lib/programs/data"

/** What the company and its care team see of a member, on the home pages of a company's site. */
export function YourData({ name, programs }: { name: string; programs: Pick<Program, "careTeamReview">[] }) {
  return (
    <section aria-labelledby="data-heading" className="space-y-2 rounded-xl border bg-muted/40 p-6">
      <h2 id="data-heading" className="flex items-center gap-2 text-xl font-semibold">
        <ShieldCheck aria-hidden="true" className="h-5 w-5 text-primary" /> Your data
      </h2>
      <p>
        {programs.some((program) => program.careTeamReview)
          ? `In a program where ${name}'s care team reviews your reports, its clinicians see your reports and what you log. Otherwise ${name} sees totals only, such as how many people improved on each measure.`
          : `${name} sees totals only, such as how many people improved on each measure. ${name} does not see your own values.`}{" "}
        You can leave a program at any time.
      </p>
    </section>
  )
}
