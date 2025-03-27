import { CalendarClock, MapPin, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TrialHeaderProps {
  trial: any // Using any for brevity, but should be properly typed
}

export function TrialHeader({ trial }: TrialHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{trial.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-blue-600 bg-blue-50">
              {trial.status || "Recruiting"}
            </Badge>
            <span className="text-sm text-muted-foreground">Trial ID: {trial.id}</span>
          </div>
        </div>

        {trial.sponsor && (
          <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
            {trial.sponsor.logo_url ? (
              <img
                src={trial.sponsor.logo_url || "/placeholder.svg"}
                alt={trial.sponsor.name}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-medium text-sm">{trial.sponsor.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{trial.sponsor.name}</p>
              <p className="text-xs text-muted-foreground">Sponsor</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-lg text-muted-foreground">{trial.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Duration</p>
            <p className="text-sm text-muted-foreground">{trial.timeline?.duration || "12 weeks"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Locations</p>
            <p className="text-sm text-muted-foreground">
              {trial.locations?.length || "3"} sites{" "}
              {trial.locations?.some((l: any) => l.remote) ? "(remote available)" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Participants</p>
            <p className="text-sm text-muted-foreground">
              {trial.enrolled || "0"}/{trial.target_enrollment || "500"} enrolled
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

