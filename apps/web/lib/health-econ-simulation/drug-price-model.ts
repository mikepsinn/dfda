import { ModelParameter } from './types';

export const drugPriceModelParameters = {
  averageClinicalTrialCost: {
    displayName: 'Average Clinical Trial Cost',
    defaultValue: 19000000, // Median cost from JHU study
    unitName: 'USD',
    description: 'Median cost of clinical trials for FDA approval',
    sourceUrl: 'https://publichealth.jhu.edu/2018/cost-of-clinical-trials-for-new-drug-FDA-approval-are-fraction-of-total-tab',
    emoji: '💊'
  },
  clinicalTrialCostPercentage: {
    displayName: 'Clinical Trial Cost Percentage',
    defaultValue: 0.25, // Using the lower end from CBO
    unitName: 'percentage',
    description: 'Percentage of total development costs that clinical trials represent',
    sourceUrl: 'https://www.cbo.gov/publication/57126',
    emoji: '📊'
  },
  developmentCostMultiplier: {
    displayName: 'Development Cost Multiplier',
    defaultValue: 3.5, // Median of 2-5x from JAMA
    unitName: 'factor',
    description: 'Multiplier from development costs to final drug price',
    sourceUrl: 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2820562',
    emoji: '➗'
  },
  marketAdjustmentFactor: {
    displayName: 'Market Adjustment Factor',
    defaultValue: 1.2, // From ASPE report
    unitName: 'factor',
    description: 'Additional market factors influencing final price',
    sourceUrl: 'https://aspe.hhs.gov/reports/examination-clinical-trial-costs-barriers-drug-development-0',
    emoji: '🏪'
  }
} satisfies Record<string, ModelParameter>;

export function calculatePriceChange(
  costReductionPercentage: number,
  parameters: typeof drugPriceModelParameters = drugPriceModelParameters
): number {
  // Calculate new clinical trial cost
  const newTrialCost = parameters.averageClinicalTrialCost.defaultValue *
    (1 - costReductionPercentage / 100);

  // Calculate total development cost change
  const originalTrialCost = parameters.averageClinicalTrialCost.defaultValue;
  const trialCostSavings = originalTrialCost - newTrialCost;
  const originalDevCost = originalTrialCost / parameters.clinicalTrialCostPercentage.defaultValue;
  const newDevCost = originalDevCost - trialCostSavings;

  // Calculate price change
  const originalPrice = originalDevCost *
    parameters.developmentCostMultiplier.defaultValue *
    parameters.marketAdjustmentFactor.defaultValue;
  const newPrice = newDevCost *
    parameters.developmentCostMultiplier.defaultValue *
    parameters.marketAdjustmentFactor.defaultValue;

  return ((newPrice - originalPrice) / originalPrice) * 100;
}
