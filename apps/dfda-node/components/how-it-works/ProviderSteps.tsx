import { Step1ReviewPatientMatches } from "./provider-steps/Step1ReviewPatientMatches";
import { Step2AssignIntervention } from "./provider-steps/Step2AssignIntervention";
import { Step3MonitorProgress } from "./provider-steps/Step3MonitorProgress";

export function ProviderSteps() {
  return (
    <div className="space-y-16">
      <Step1ReviewPatientMatches />
      <Step2AssignIntervention />
      <Step3MonitorProgress />
    </div>
  );
} 