import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import type { Program } from "@/lib/programs/data"

/** The programs of a company instance. A program that the user joined links to their own program page. */
export function ProgramList({ programs, joined }: { programs: Program[]; joined: Set<string> }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {programs.map((program) => {
        const member = joined.has(program.id)
        return (
          <li key={program.id}>
            <Link
              href={member ? `/programs/${program.slug}/me` : `/programs/${program.slug}`}
              className="flex h-full flex-col gap-2 rounded-xl border p-6 transition-colors hover:bg-muted/50"
            >
              <h3 className="text-lg font-semibold">{program.name}</h3>
              {program.summary && <p className="text-muted-foreground">{program.summary}</p>}
              {member && (
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-primary" /> You joined
                </p>
              )}
              <span className="mt-auto inline-flex items-center gap-1 pt-2 font-medium text-primary">
                {member ? "Open your program" : "Learn more"} <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
