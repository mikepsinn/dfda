import { Lightbulb } from "lucide-react"
import { PatientStep } from "../PatientStep"

export function Step6GainInsights() {
  return (
    <PatientStep
      stepNumber={6}
      title="Gain Personal Insights"
      icon={<Lightbulb className="h-5 w-5 text-primary" />}
      description="View personalized analytics about your health and treatment response."
      benefits={[
        "See how your response compares to others",
        "Identify patterns in your symptoms and triggers",
        "Track your progress over time",
        "Receive personalized recommendations",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="font-bold">Your Treatment Response</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <div className="font-medium text-sm">Cognitive Function Trend</div>
                  <div className="text-xs text-green-500 font-medium">↑ 15%</div>
                </div>
                <div className="h-20 mt-2 flex items-end gap-1">
                  {[20, 25, 30, 35, 40, 45, 50].map((h, i) => (
                    <div key={i} className="bg-primary/80 rounded-sm w-full" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Apr 1</span>
                  <span>Apr 7</span>
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <div className="font-medium text-sm">Insight</div>
                <div className="text-sm mt-1">
                  Your cognitive function scores improve on days following social activities.
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <div className="font-medium text-sm">Recommendation</div>
                <div className="text-sm mt-1">
                  Consider taking your medication in the evening to reduce the daytime fatigue you've reported.
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      reverse={true}
    />
  )
}

