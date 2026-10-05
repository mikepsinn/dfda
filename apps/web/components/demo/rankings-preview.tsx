"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RankingsPreviewCondition } from "@/lib/demo/landing-preview";

// Receives only the ranked summary rows, not full treatment records. `links` adds the links to each
// Outcome Label and to the full rankings; the institute's page (/institute) leaves them out.
export function RankingsPreview({ conditions, links = true }: { conditions: RankingsPreviewCondition[]; links?: boolean }) {
  const [selected, setSelected] = useState(conditions[0]?.slug);
  const condition = conditions.find(item => item.slug === selected) ?? conditions[0];
  if (!condition) return null;

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Example conditions" className="flex flex-wrap justify-center gap-2">
        {conditions.map(item => (
          <Button key={item.slug} type="button" className="rounded-full"
            variant={item.slug === condition.slug ? "default" : "outline"}
            aria-pressed={item.slug === condition.slug} onClick={() => setSelected(item.slug)}>
            {item.name}
          </Button>
        ))}
      </div>

      <ol className="space-y-4" aria-label={`Top ${condition.name} treatments by estimated effectiveness`}>
        {condition.treatments.map((treatment, index) => (
          <li key={treatment.slug} className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Rank {index + 1}</p>
                <h3 className="break-words font-medium">{treatment.name}</h3>
              </div>
              <div className="sm:shrink-0 sm:text-right">
                <div className="text-2xl font-bold tabular-nums text-primary">
                  {treatment.effectiveness}<span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span>
                </div>
                <p className="text-xs text-muted-foreground">Effectiveness estimate</p>
              </div>
            </div>
            <div aria-hidden="true" className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${treatment.effectiveness}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-muted-foreground">
                Safety estimate: <span className="font-medium tabular-nums text-foreground">{treatment.safetyScore} / 100</span>
              </p>
              {links && (
                <Link href={treatment.href} className="inline-flex items-center gap-1 rounded-sm font-medium text-primary hover:underline">
                  View Outcome Label<span className="sr-only"> for {treatment.name}</span>
                  <ArrowRight aria-hidden="true" className="h-3 w-3" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          Top {condition.treatments.length} of {condition.treatmentCount} treatments. Scores use a 0–100 scale,
          not response percentages.
        </p>
        {links && (
          <Button asChild variant="outline" className="h-auto min-h-10 shrink-0 gap-1 whitespace-normal">
            <Link href={`/treatment-rankings?condition=${condition.slug}`}>
              All {condition.name} rankings <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
