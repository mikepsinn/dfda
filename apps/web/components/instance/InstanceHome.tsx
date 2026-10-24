import Link from "next/link"
import { ArrowRight, BarChart3, ClipboardList, LineChart, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DemoTryButtons } from "@/components/instance/DemoTryButtons"
import { ProgramList } from "@/components/programs/ProgramList"
import type { InstanceBranding } from "@/lib/instance/config"
import type { Program } from "@/lib/programs/data"

const STEPS = [
  {
    icon: ClipboardList,
    title: "Join a program",
    text: "Join the program for the product that you use. Enter your lab results from before you start.",
  },
  {
    icon: LineChart,
    title: "Track",
    text: "Record your doses and how you feel. At the follow-up, enter your lab results again.",
  },
  {
    icon: BarChart3,
    title: "See what changed",
    text: "Your report shows each measure at the start and now, and whether it improved.",
  },
]

/** The home page of a company instance: the company, its programs and how a program works. No network pages. */
export function InstanceHome({
  instance,
  programs,
  joined,
}: {
  instance: Pick<InstanceBranding, "name" | "byline" | "tagline" | "products" | "demoEnabled">
  programs: Program[]
  joined: Set<string>
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-14">
      <section className="brand-panel space-y-6 rounded-[calc(var(--radius)*2.5)] border p-6 sm:p-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">{instance.name}</h1>
          {instance.byline && <p className="text-lg font-medium text-muted-foreground">{instance.byline}</p>}
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
          {instance.tagline ?? "Track your treatments and how you feel, and see what worked for people like you."}
        </p>
        {instance.products.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Track your results with</p>
            <ul aria-label="Products" className="flex flex-wrap gap-2">
              {instance.products.map((product) => (
                <li key={product} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {product}
                </li>
              ))}
            </ul>
          </div>
        )}
        {programs.length > 0 && (
          <Button asChild size="lg" className="primary-glow gap-1">
            <Link href="#programs">
              See the programs <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
        )}
        {instance.demoEnabled && (
          <div className="space-y-2 border-t pt-6">
            <p className="font-medium">See how it works with a demo patient</p>
            <DemoTryButtons />
          </div>
        )}
      </section>

      {programs.length > 0 && (
        <section id="programs" aria-labelledby="programs-heading" className="scroll-mt-20 space-y-6">
          <h2 id="programs-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Programs
          </h2>
          <ProgramList programs={programs} joined={joined} />
        </section>
      )}

      <section aria-labelledby="how-heading" className="space-y-6">
        <h2 id="how-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
          How a program works
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="surface-raised space-y-2 rounded-xl border p-6">
              <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="data-heading" className="space-y-2 rounded-xl border bg-muted/40 p-6">
        <h2 id="data-heading" className="flex items-center gap-2 text-xl font-semibold">
          <ShieldCheck aria-hidden="true" className="h-5 w-5 text-primary" /> Your data
        </h2>
        <p>
          {programs.some((program) => program.careTeamReview)
            ? `In a program where ${instance.name}'s care team reviews your reports, its clinicians see your reports and what you log. Otherwise ${instance.name} sees totals only, such as how many people improved on each measure.`
            : `${instance.name} sees totals only, such as how many people improved on each measure. ${instance.name} does not see your own values.`}{" "}
          You can leave a program at any time.
        </p>
      </section>
    </div>
  )
}
