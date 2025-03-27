import { Calendar } from "lucide-react"
import { PatientStep } from "../PatientStep"

export function Step4CoordinateCare() {
  return (
    <PatientStep
      stepNumber={4}
      title="Coordinate Your Care"
      icon={<Calendar className="h-5 w-5 text-primary" />}
      description="Schedule lab tests, doctor visits, and import your health records."
      benefits={[
        "Book appointments with just a few clicks",
        "Import data from your existing health records",
        "Attend virtual check-ins from anywhere",
        "Receive reminders for upcoming appointments",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="font-bold">Your Care Schedule</div>
            <div className="space-y-3">
              <div className="rounded-lg border p-3 bg-card">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">Cognitive Assessment</div>
                    <div className="text-sm text-muted-foreground">Neurology Center</div>
                  </div>
                  <div className="text-sm text-right">
                    <div>May 15, 2023</div>
                    <div>9:30 AM</div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">Virtual Check-in</div>
                    <div className="text-sm text-muted-foreground">Dr. Robert Chen, Neurologist</div>
                  </div>
                  <div className="text-sm text-right">
                    <div>May 22, 2023</div>
                    <div>2:00 PM</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="bg-primary text-primary-foreground rounded px-3 py-1 text-xs text-center w-24">
                    Join Now
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="bg-primary/10 text-primary rounded px-3 py-1 text-xs">Import Health Records</div>
                <div className="bg-primary/10 text-primary rounded px-3 py-1 text-xs">Schedule New Appointment</div>
              </div>
            </div>
          </div>
        </div>
      }
      reverse={true}
    />
  )
}

