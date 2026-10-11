import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Program } from "@/lib/programs/data"

/** The programs of a company instance, on its home page. */
export function ProgramsSection({ programs }: { programs: Program[] }) {
  if (programs.length === 0) return null
  return (
    <section aria-labelledby="programs-heading" className="w-full py-12 md:py-16">
      <div className="container space-y-6 px-4 md:px-6">
        <h2 id="programs-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
          Programs
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <li key={program.id}>
              <Link href={`/programs/${program.slug}`} className="flex h-full flex-col gap-2 rounded-xl border p-6 transition-colors hover:bg-muted/50">
                <h3 className="text-lg font-semibold">{program.name}</h3>
                {program.summary && <p className="text-muted-foreground">{program.summary}</p>}
                <span className="mt-auto inline-flex items-center gap-1 pt-2 font-medium text-primary">
                  Learn more <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
