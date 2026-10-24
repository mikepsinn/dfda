"use client"

import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { Evidence } from "@/lib/care-team/evidence"

const WHY: Record<Evidence["expectation"], string> = {
  down: "Why a decrease was expected",
  up: "Why an increase was expected",
  mixed: "Why the evidence is mixed",
  none: "Why no change is expected",
}

/** The studies behind a marker's expected change, in a side panel: each with its population, its finding and its limits. */
export function EvidenceSheet({ markerName, evidence }: { markerName: string; evidence: Evidence }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          {WHY[evidence.expectation]}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="space-y-1 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">References · {markerName}</p>
          <SheetTitle>{WHY[evidence.expectation]}</SheetTitle>
          <SheetDescription>{evidence.summary}</SheetDescription>
        </SheetHeader>
        <ol className="mt-6 space-y-4">
          {evidence.sources.map((source, index) => (
            <li key={source.url + source.reported} className="space-y-2 rounded-2xl border p-4 text-sm">
              <p className="flex items-start gap-2 font-semibold">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                  {index + 1}
                </span>
                {source.kind}
              </p>
              <dl className="space-y-1.5">
                <div>
                  <dt className="text-xs text-muted-foreground">Population</dt>
                  <dd>{source.population}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Reported</dt>
                  <dd>{source.reported}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Limits</dt>
                  <dd>{source.limits}</dd>
                </div>
              </dl>
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary underline">
                {source.citation} <ExternalLink aria-hidden="true" className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ol>
      </SheetContent>
    </Sheet>
  )
}
