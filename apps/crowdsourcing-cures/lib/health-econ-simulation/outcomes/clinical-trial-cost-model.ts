import { ModelParameter } from '../types';

export class ClinicalTrialCostModel {
  public readonly costReductionPercentage: number;

  constructor(costReductionPercentage: number = 0.95) {
    this.costReductionPercentage = costReductionPercentage;
  }

  public get baselineMetrics() {
    return {
      average_trial_cost: clinicalTrialParameters.average_trial_cost.defaultValue,
      success_rate: clinicalTrialParameters.success_rate.defaultValue,
      time_to_market: clinicalTrialParameters.time_to_market.defaultValue,
    };
  }

  calculate_price_impact() {
    const reducedTrialCost = clinicalTrialParameters.average_trial_cost.defaultValue * (1 - this.costReductionPercentage);
    return reducedTrialCost;
  }
}

export const clinicalTrialParameters: Record<string, ModelParameter> = {
  average_trial_cost: {
    displayName: "Average Clinical Trial Cost",
    defaultValue: 375000000 * 0.05, // $375M for phases 1-3
    unitName: "USD",
    description: "Average total cost of clinical trials phases 1-3 for a single drug",
    sourceUrl: "https://www.cbo.gov/publication/57126",
    emoji: "💰",
    generateDisplayValue: (value: number) => `$${(value / 1000000).toFixed(1)}M`
  },
  success_rate: {
    displayName: "Clinical Trial Success Rate",
    defaultValue: 0.12, // 12% overall success rate
    unitName: "%",
    description: "Probability of a drug candidate successfully completing all clinical trial phases",
    sourceUrl: "https://www.cbo.gov/publication/57126",
    emoji: "🎯",
    generateDisplayValue: (value: number) => `${(value * 100).toFixed(1)}%`
  },
  time_to_market: {
    displayName: "Average Time to Market",
    defaultValue: 7, // 7 years average clinical trial duration
    unitName: "years",
    description: "Average time from clinical trial start to market approval",
    sourceUrl: "https://www.cbo.gov/publication/57126",
    emoji: "⏱️",
    generateDisplayValue: (value: number) => `${value.toFixed(1)} years`
  }
};
