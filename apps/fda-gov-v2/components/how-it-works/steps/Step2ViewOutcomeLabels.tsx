import { FileText } from "lucide-react"
import { PatientStep } from "../PatientStep"

export function Step2ViewOutcomeLabels() {
  return (
    <PatientStep
      stepNumber={2}
      title="View Outcome Labels"
      icon={<FileText className="h-5 w-5 text-primary" />}
      description="Review comprehensive outcome data before deciding to join a trial."
      benefits={[
        "See real effectiveness data from actual patients",
        "Understand potential side effects and their frequency",
        "Compare with standard of care treatments",
        "Read about experiences from patients like you",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="font-bold text-lg border-b pb-2">Klotho-Increasing Gene Therapy</div>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-sm mb-2">Change from Baseline (6 months)</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Cognitive Function (ADAS-Cog)</span>
                      <span className="text-green-600">+28%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-3 bg-green-500 rounded-full" style={{ width: "28%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Memory Recall</span>
                      <span className="text-green-600">+35%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-3 bg-green-500 rounded-full" style={{ width: "35%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Executive Function</span>
                      <span className="text-green-600">+22%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-3 bg-green-500 rounded-full" style={{ width: "22%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Hippocampal Volume</span>
                      <span className="text-green-600">+15%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-3 bg-green-500 rounded-full" style={{ width: "15%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="font-medium text-sm mb-2">Side Effects</div>
                <div className="space-y-2 mt-1">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Immune Response</span>
                      <span>12%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-2 bg-amber-400 rounded-full" style={{ width: "12%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Headache</span>
                      <span>9%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-2 bg-amber-400 rounded-full" style={{ width: "9%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Fatigue</span>
                      <span>7%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-2 bg-amber-400 rounded-full" style={{ width: "7%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-primary font-medium cursor-pointer hover:underline">
                View full outcome label →
              </div>
            </div>
          </div>
        </div>
      }
      reverse={true}
    />
  )
}

