import { Badge } from "@/components/ui/badge"
import type { TrialDetails } from "@/lib/actions/trials"
import { formatTrialPhase, formatTrialStatus } from "./format"

interface TrialHeaderProps {
  trial: TrialDetails
}

export function TrialHeader({ trial }: TrialHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{formatTrialStatus(trial.status)}</Badge>
          {trial.phase && <Badge variant="outline">{formatTrialPhase(trial.phase)}</Badge>}
        </div>
        <h1 className="break-words text-3xl font-bold">{trial.title}</h1>
        {trial.research_partner_name && (
          <p className="text-muted-foreground">Sponsored by {trial.research_partner_name}</p>
        )}
      </div>

      {trial.description && <p className="text-lg text-muted-foreground">{trial.description}</p>}
    </div>
  )
}
