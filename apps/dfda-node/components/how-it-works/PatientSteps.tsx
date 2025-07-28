import { Step1FindTrials } from "./steps/Step1FindTrials"
import { Step2ViewOutcomeLabels } from "./steps/Step2ViewOutcomeLabels"
import { Step3JoinTrial } from "./steps/Step3JoinTrial"
import { Step4CoordinateCare } from "./steps/Step4CoordinateCare"
import { Step5TrackData } from "./steps/Step5TrackData"
import { Step6GainInsights } from "./steps/Step6GainInsights"
import { Step7FDAiAgent } from "./steps/Step7FDAiAgent"

export function PatientSteps() {
  return (
    <div className="space-y-16">
      <Step1FindTrials />
      <Step2ViewOutcomeLabels />
      <Step3JoinTrial />
      <Step4CoordinateCare />
      <Step5TrackData />
      <Step6GainInsights />
      <Step7FDAiAgent />
    </div>
  )
}

