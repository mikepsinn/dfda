import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ConditionPicker } from "@/components/demo/condition-picker"
import { EstimateNotice } from "@/components/demo/estimate-notice"
import { RankingsPreview } from "@/components/demo/rankings-preview"
import type { RankingsPreviewCondition } from "@/lib/demo/landing-preview"

type ConditionOption = { slug: string; name: string; synonyms: string[] }

export function ComparativeEffectivenessSection({ preview, conditionIndex }: {
  preview: RankingsPreviewCondition[]
  conditionIndex: ConditionOption[]
}) {
  return (
    <section className="band-muted w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Comparative Effectiveness Rankings
          </h2>
          <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Compare the estimated effectiveness and safety of treatments for {conditionIndex.length} conditions
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-4xl">
          <Card>
            <CardHeader className="gap-4">
              <form action="/treatment-rankings" method="get"
                className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <ConditionPicker conditions={conditionIndex} initialValue={preview[0]?.slug ?? ""} />
                <Button type="submit" size="lg" className="h-11 gap-2">
                  Compare treatments <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Button>
              </form>
              <EstimateNotice />
            </CardHeader>
            <CardContent>
              {preview.length > 0 ? (
                <RankingsPreview conditions={preview} />
              ) : (
                <p role="status" className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                  The example rankings are not available. Search for a condition above.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
