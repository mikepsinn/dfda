import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProgramForm } from "@/components/programs/ProgramForm"
import { createProgramAction } from "@/lib/actions/programs"
import { PROGRAM_TEMPLATES, usableTemplate } from "@/lib/programs/config"
import { variableOptions } from "@/lib/programs/data"
import { requireOwnedInstance } from "@/lib/programs/owner"

export const metadata: Metadata = { title: "New program" }

export default async function NewProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [{ instance }, variables] = await Promise.all([requireOwnedInstance(slug), variableOptions()])
  const templates = PROGRAM_TEMPLATES.map((template) => usableTemplate(template, variables))

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <Link href={`/instances/${instance.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {instance.name}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New program</h1>
        <p className="max-w-2xl text-muted-foreground">
          A program says what your customers track while they use your product, and when they measure again. Each
          person gets a before/after report. You see totals for all of them.
        </p>
      </header>
      <ProgramForm
        action={createProgramAction.bind(null, instance.slug)}
        initial={{ ...templates[0], careTeamReview: true }}
        templates={templates}
        variables={variables}
        submitLabel="Create program"
        addressPrefix="/programs/"
      />
    </div>
  )
}
