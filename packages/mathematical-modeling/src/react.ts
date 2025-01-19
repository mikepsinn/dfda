import { PopulationInterventionModel } from './models/base/PopulationInterventionModel';
import { InputParameter } from './models/base/InputParameter';
import { OutcomeMetric } from './models/base/OutcomeMetric';

export type InterventionHookResult = {
  parameters: InputParameter[];
  metrics: OutcomeMetric[];
  results: Record<string, number>;
  setParameterValue: (id: string, value: number) => void;
  generateReport: () => string;
};

/**
 * React hook for integrating a population intervention model into a component.
 * Manages parameter state and calculates results based on parameter changes.
 */
export function useInterventionModel(model: PopulationInterventionModel): InterventionHookResult {
  const setParameterValue = (id: string, value: number) => {
    model.setParameterValue(id, value);
  };

  return {
    parameters: model.parameters,
    metrics: model.metrics,
    results: model.calculateMetrics(),
    setParameterValue,
    generateReport: () => model.generateReport()
  };
}
