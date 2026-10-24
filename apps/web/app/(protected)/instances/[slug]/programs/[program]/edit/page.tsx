import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProgramForm } from "@/components/programs/ProgramForm"
import { updateProgramAction } from "@/lib/actions/programs"
import type { ProgramItemInput } from "@/lib/programs/config"
import { variableOptions } from "@/lib/programs/data"
import { requireOwnedProgram } from "@/lib/programs/owner"

export const metadata: Metadata = { title: "Change program" }

export default async function EditProgramPage({ params }: { params: Promise<{ slug: string; program: string }> }) {
  const { slug, program: programSlug } = await params
  const [{ instance, program }, variables] = await Promise.all([requireOwnedProgram(slug, programSlug), variableOptions()])
  const items: ProgramItemInput[] = program.items.map((item) =>
    item.kind === "dose"
      ? { kind: "dose", variableId: item.variableId, frequency: item.frequency ?? "daily", defaultValue: item.defaultValue }
      : item.kind === "check_in"
        ? { kind: "check_in", variableId: item.variableId, frequency: item.frequency ?? "daily", better: item.better ?? "neither" }
        : { kind: "lab", variableId: item.variableId, better: item.better ?? "neither" },
  )

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <Link
          href={`/instances/${instance.slug}/programs/${program.slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {program.name}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Change program</h1>
        <p className="max-w-2xl text-muted-foreground">
          People who already joined keep their reminders. Their reports use the new list.
        </p>
      </header>
      <ProgramForm
        action={updateProgramAction.bind(null, instance.slug, program.slug)}
        initial={{
          name: program.name,
          slug: program.slug,
          summary: program.summary ?? "",
          followUpWeeks: program.followUpWeeks,
          careTeamReview: program.careTeamReview,
          items,
        }}
        variables={variables}
        submitLabel="Save changes"
        addressPrefix="/programs/"
      />
    </div>
  )
}
