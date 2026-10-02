import { Check, LineChart, Phone } from "lucide-react"
import { HowItWorksStep } from "../HowItWorksStep"

// Example memory-test scores (0–30 scale) for the last six weekly check-ins.
const memoryScores = [26, 27, 27, 28, 27, 28]
const sparklineWidth = 120
const sparklineHeight = 32
const sparklinePoints = memoryScores
  .map((score, index) => {
    const x = (index / (memoryScores.length - 1)) * sparklineWidth
    const y = sparklineHeight - ((score - 24) / (30 - 24)) * sparklineHeight
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  .join(" ")

export function Step5TrackData() {
  return (
    <HowItWorksStep
      stepNumber={5}
      title="Track Outcomes"
      icon={<LineChart className="h-5 w-5 text-primary" />}
      description="Quick check-ins record how you're doing. Every result, good or bad, improves the outcome labels for the next patient."
      benefits={[
        "Simple mobile app for daily tracking",
        "Automatic data collection from wearables",
        "Customized tracking based on your trial",
        "Secure and private data storage",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-bold">Daily Tracking</div>
              <div className="text-xs text-muted-foreground">Week 6 · Today</div>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border p-3 bg-card">
                <div className="font-medium">Memory test</div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-2xl font-semibold tabular-nums text-primary">
                      28<span className="text-sm font-normal text-muted-foreground"> / 30</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Steady over 6 weeks</div>
                  </div>
                  <svg
                    role="img"
                    aria-label={`Memory test scores over six weeks: ${memoryScores.join(", ")}`}
                    viewBox={`-2 -2 ${sparklineWidth + 4} ${sparklineHeight + 4}`}
                    className="h-8 w-28 shrink-0 text-primary"
                  >
                    <polyline points={sparklinePoints} fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <div className="font-medium">Doses</div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check aria-hidden="true" className="h-3 w-3" />
                  </span>
                  <span>Morning dose</span>
                  <span className="ml-auto text-muted-foreground tabular-nums">Taken 8:02 AM</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-sm">
                  <span aria-hidden="true" className="h-5 w-5 rounded-full border" />
                  <span>Evening dose</span>
                  <span className="ml-auto text-muted-foreground tabular-nums">Due 8:00 PM</span>
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <div className="font-medium">Check-in</div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Phone aria-hidden="true" className="h-4 w-4 text-primary" />
                  <span>Answered by phone, no side effects</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Next check-in tomorrow at 9:00 AM</div>
              </div>
            </div>
          </div>
        </div>
      }
      reverse={false}
    />
  )
}
