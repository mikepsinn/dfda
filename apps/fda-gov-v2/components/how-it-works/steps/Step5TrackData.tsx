import { LineChart } from "lucide-react"
import { PatientStep } from "../PatientStep"

export function Step5TrackData() {
  return (
    <PatientStep
      stepNumber={5}
      title="Track Your Data"
      icon={<LineChart className="h-5 w-5 text-primary" />}
      description="Record your diet, treatment adherence, symptoms, and more."
      benefits={[
        "Simple mobile app for daily tracking",
        "Automatic data collection from wearables",
        "Customized tracking based on your trial",
        "Secure and private data storage",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="font-bold">Daily Tracking</div>
            <div className="space-y-3">
              <div className="rounded-lg border p-3 bg-card">
                <div className="font-medium">Cognitive Function</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="text-sm">Today's score:</div>
                  <input type="text" className="border rounded px-2 py-1 w-20 text-sm" placeholder="28" />
                  <span className="text-sm text-muted-foreground">/ 30</span>
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <div className="font-medium">Medication Taken</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-5 w-5 rounded border flex items-center justify-center">
                    <div className="h-3 w-3 bg-primary rounded-sm"></div>
                  </div>
                  <span className="text-sm">Morning dose</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-5 w-5 rounded border flex items-center justify-center">
                    <div className="h-3 w-3 bg-primary rounded-sm"></div>
                  </div>
                  <span className="text-sm">Evening dose</span>
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <div className="font-medium">Daily Activities</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-5 w-5 rounded border flex items-center justify-center">
                    <div className="h-3 w-3 bg-primary rounded-sm"></div>
                  </div>
                  <span className="text-sm">Completed memory exercises</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-5 w-5 rounded border"></div>
                  <span className="text-sm">Completed physical activity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      reverse={false}
    />
  )
}

