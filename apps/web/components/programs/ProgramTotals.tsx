import { formatPercent } from "@/lib/programs/format"
import { MIN_GROUP_SIZE, type MeasureTotals } from "@/lib/programs/report"

function Share({ count, of }: { count: number; of: number }) {
  return (
    <>
      {count} <span className="text-muted-foreground">({Math.round((count / of) * 100)}%)</span>
    </>
  )
}

/** The company's view of a program: per measure, how many people improved. Totals only. */
export function ProgramTotals({ totals }: { totals: MeasureTotals[] }) {
  return (
    <div className="surface-raised overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">Measure</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">People</th>
            <th scope="col" className="px-4 py-2 font-medium">Improved · no change · worse</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Improved</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Worse</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Median change</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {totals.map((measure) => {
            const neither = measure.better === "neither"
            return (
              <tr key={measure.variableId}>
                <th scope="row" className="px-4 py-3 font-medium">
                  {measure.name} <span className="font-normal text-muted-foreground">({measure.unit})</span>
                </th>
                <td className="px-4 py-3 text-right tabular-nums">
                  {measure.hidden ? `Fewer than ${MIN_GROUP_SIZE}` : measure.people}
                </td>
                {measure.hidden ? (
                  <td colSpan={4} className="px-4 py-3 text-muted-foreground">
                    Shown when at least {MIN_GROUP_SIZE} people have a value at the start and later.
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      {neither ? (
                        <span className="text-muted-foreground">
                          {measure.changed} changed, {measure.unchanged} did not (no better direction)
                        </span>
                      ) : (
                        <div
                          className="flex h-3 w-40 overflow-hidden rounded-full bg-muted"
                          role="img"
                          aria-label={`${measure.improved} improved, ${measure.unchanged} no change, ${measure.worse} worse`}
                        >
                          <span className="bg-emerald-500" style={{ width: `${(measure.improved / measure.people) * 100}%` }} />
                          <span className="bg-muted-foreground/30" style={{ width: `${(measure.unchanged / measure.people) * 100}%` }} />
                          <span className="bg-rose-500" style={{ width: `${(measure.worse / measure.people) * 100}%` }} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {neither ? "–" : <Share count={measure.improved} of={measure.people} />}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {neither ? "–" : <Share count={measure.worse} of={measure.people} />}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {measure.medianPercentChange === null ? "–" : formatPercent(measure.medianPercentChange)}
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
