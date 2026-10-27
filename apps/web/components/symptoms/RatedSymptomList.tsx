import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/programs/format"
import type { RatedSymptom } from "@/lib/programs/side-effects"

/**
 * Symptoms with the person's ratings: the number of ratings, the date and the
 * value of the last one. Each row has a button (a form action) when `action`
 * gives one, such as removing the symptom from a treatment.
 */
export function RatedSymptomList({
  label,
  symptoms,
  action,
}: {
  label: string
  symptoms: RatedSymptom[]
  action?: { label: (name: string) => string; text?: string; form: (variableId: string) => () => Promise<void> }
}) {
  return (
    <ul aria-label={label} className="space-y-3">
      {symptoms.map(({ item, ratings }) => (
        <li key={item.variableId} className="flex items-center justify-between gap-4 rounded-md border bg-muted/50 p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              {ratings.length > 0
                ? `${ratings.length} rating${ratings.length !== 1 ? "s" : ""}. The last one is from ${formatDate(ratings[0].at)}.`
                : "No ratings yet."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {ratings.length > 0 && (
              <Badge variant="secondary">
                {ratings[0].value} ({ratings[0].unit})
              </Badge>
            )}
            {action && (
              <form action={action.form(item.variableId)}>
                {action.text ? (
                  <Button type="submit" variant="outline" size="sm" aria-label={action.label(item.name)}>
                    {action.text}
                  </Button>
                ) : (
                  <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 rounded-full" aria-label={action.label(item.name)}>
                    <X aria-hidden="true" className="h-4 w-4" />
                  </Button>
                )}
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
