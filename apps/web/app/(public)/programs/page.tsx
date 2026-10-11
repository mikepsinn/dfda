import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProgramList } from "@/components/programs/ProgramList"
import { resolveInstance } from "@/lib/instance/resolve"
import { joinedProgramIds, listPrograms } from "@/lib/programs/data"
import { getServerUser } from "@/lib/server-auth"

export const metadata: Metadata = { title: "Programs" }

/** The programs of a company instance. The main site has no programs of its own. */
export default async function ProgramsPage() {
  const instance = await resolveInstance()
  if (!instance) notFound()
  const [programs, user] = await Promise.all([listPrograms(instance.slug), getServerUser()])
  const joined = await joinedProgramIds(user, programs.map((program) => program.id))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">{instance.name}</p>
        <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
        <p className="max-w-2xl text-muted-foreground">
          Each program tells you what to track while you use a product. At the end, you get a before/after report.
        </p>
      </header>
      {programs.length === 0 ? (
        <p className="rounded-xl border p-6 text-muted-foreground">{instance.name} has no programs yet.</p>
      ) : (
        <ProgramList programs={programs} joined={joined} />
      )}
    </div>
  )
}
