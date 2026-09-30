import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { TrialDetails } from "@/lib/actions/trials"
import { formatTrialDate, formatTrialPhase } from "./format"

interface TrialContentProps {
  trial: TrialDetails
}

// Shows only what the trial record contains. A missing value is shown as missing, never as a default.
export function TrialContent({ trial }: TrialContentProps) {
  const facts: [label: string, value: string | null][] = [
    ["Condition", trial.condition_name],
    ["Treatment", trial.treatment_name],
    ["Phase", trial.phase ? formatTrialPhase(trial.phase) : null],
    ["Location", trial.location],
    ["Start date", trial.start_date ? formatTrialDate(trial.start_date) : null],
    ["End date", trial.end_date ? formatTrialDate(trial.end_date) : null],
    [
      "Enrollment",
      trial.enrollment_target != null
        ? `${trial.current_enrollment ?? 0} of ${trial.enrollment_target} participants`
        : null,
    ],
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">About this trial</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm font-medium">{label}</dt>
                <dd className={`break-words text-sm ${value ? "" : "text-muted-foreground"}`}>
                  {value ?? "Not provided"}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Eligibility</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <CriteriaList title="Inclusion criteria" items={trial.inclusion_criteria} />
          <CriteriaList title="Exclusion criteria" items={trial.exclusion_criteria} />
        </CardContent>
      </Card>
    </div>
  )
}

function CriteriaList({ title, items }: { title: string; items: string[] | null }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {items?.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Not provided by the sponsor.</p>
      )}
    </div>
  )
}
