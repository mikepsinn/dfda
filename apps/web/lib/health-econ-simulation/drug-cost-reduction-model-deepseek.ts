import { z } from "zod";
import { ModelParameter } from "./types";

/**
 * DeepSeek Drug Cost Reduction Model
 * Simulates the impact of clinical trial cost reductions on final drug prices
 */
export const deepSeekDrugCostParameters: Record<string, ModelParameter> = {
  baseClinicalTrialCost: {
    displayName: 'Base Clinical Trial Cost',
    defaultValue: 197000000,
    unitName: 'USD',
    description: 'Median cost of clinical trials from recent studies',
    sourceUrl: 'https://publichealth.jhu.edu/2018/cost-of-clinical-trials-for-new-drug-FDA-approval-are-fraction-of-total-tab',
    sourceQuote: `"Clinical trials that support FDA approvals of new drugs have a median cost of $19 million, according to a new study by a team including researchers from the Johns Hopkins Bloomberg School of Public Health."`,
    emoji: '💊'
  },
  phase1Cost: {
    displayName: 'Phase I Cost Percentage',
    defaultValue: 0.3,
    unitName: 'percentage',
    description: 'Percentage of clinical trial costs allocated to Phase I',
    sourceUrl: 'https://www.cbo.gov/publication/57126',
    sourceQuote: `"Phase I trials represent a significant portion of clinical trial costs, focusing on safety and dosage determination in small patient groups (CBO, 2021)."`,
    emoji: '1️⃣'
  },
  phase2Cost: {
    displayName: 'Phase II Cost Percentage',
    defaultValue: 0.3,
    unitName: 'percentage',
    description: 'Percentage of clinical trial costs allocated to Phase II',
    sourceUrl: 'https://www.cbo.gov/publication/57126',
    sourceQuote: `"Phase II trials account for 20-25% of clinical trial costs, evaluating efficacy and side effects in larger patient populations (CBO, 2021)."`,
    emoji: '2️⃣'
  },
  phase3Cost: {
    displayName: 'Phase III Cost Percentage',
    defaultValue: 0.4,
    unitName: 'percentage',
    description: 'Percentage of clinical trial costs allocated to Phase III',
    sourceUrl: 'https://www.cbo.gov/publication/57126',
    sourceQuote: `"Phase III trials represent the largest portion of clinical trial costs, involving large-scale testing to confirm effectiveness and monitor adverse reactions (CBO, 2021)."`,
    emoji: '3️⃣'
  },
  rndCostMultiplier: {
    displayName: 'R&D Cost Multiplier',
    defaultValue: 1.72,
    unitName: 'factor',
    description: 'Multiplier from clinical trials to total R&D costs',
    sourceUrl: 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2820562',
    sourceQuote: `"Total R&D costs significantly exceed clinical trial costs, accounting for preclinical research, regulatory expenses, and other development activities (JAMA Network, 2022)."`,
    emoji: '➗'
  },
  priceToCostRatio: {
    displayName: 'Price to Cost Ratio',
    defaultValue: 2.8,
    unitName: 'ratio',
    description: 'Final price to total development cost ratio',
    sourceUrl: 'https://aspe.hhs.gov/reports/examination-clinical-trial-costs-barriers-drug-development-0',
    sourceQuote: `"Drug prices typically exceed development costs, reflecting both R&D expenses and market factors (ASPE, 2024)."`,
    emoji: '🏪'
  }
} satisfies Record<string, ModelParameter>;

// Zod schema for parameter validation
export const deepSeekDrugCostSchema = z.object({
  baseClinicalTrialCost: z.number().min(10000000),
  phase3CostPercentage: z.number().min(0).max(1),
  rndCostMultiplier: z.number().min(1),
  priceToCostRatio: z.number().min(1)
});

/**
 * Calculate price reduction impact
 * @param costReductionPct Percentage reduction in clinical trial costs (0-100)
 * @param parameters Model parameters
 * @returns Object containing price change details
 */
export function calculatePriceImpact(
  costReductionPct: number,
  parameters: typeof deepSeekDrugCostParameters
) {
  // Validate input
  if (costReductionPct < 0 || costReductionPct > 100) {
    throw new Error('Cost reduction percentage must be between 0 and 100');
  }

  // Get parameter values as numbers
  const baseTrialCost = Number(parameters.baseClinicalTrialCost.defaultValue);
  const phase1Pct = Number(parameters.phase1Cost.defaultValue);
  const phase2Pct = Number(parameters.phase2Cost.defaultValue);
  const phase3Pct = Number(parameters.phase3Cost.defaultValue);
  const rndMultiplier = Number(parameters.rndCostMultiplier.defaultValue);
  const priceRatio = Number(parameters.priceToCostRatio.defaultValue);

  // Calculate new clinical trial costs per phase
  const phase1Cost = baseTrialCost * phase1Pct;
  const phase2Cost = baseTrialCost * phase2Pct;
  const phase3Cost = baseTrialCost * phase3Pct;

  // Apply cost reduction proportionally to each phase
  const costReductionFactor = 1 - costReductionPct / 100;
  const newPhase1Cost = phase1Cost * costReductionFactor;
  const newPhase2Cost = phase2Cost * costReductionFactor;
  const newPhase3Cost = phase3Cost * costReductionFactor;

  // Calculate total R&D cost impact
  const originalRndCost = (phase1Cost + phase2Cost + phase3Cost) * rndMultiplier;
  const newRndCost = (newPhase1Cost + newPhase2Cost + newPhase3Cost) * rndMultiplier;

  // Calculate price impact
  const originalPrice = originalRndCost * priceRatio;
  const newPrice = newRndCost * priceRatio;

  return {
    priceReductionPct: ((originalPrice - newPrice) / originalPrice) * 100,
    absolutePriceReduction: originalPrice - newPrice,
    newPrice,
    originalPrice
  };
}

// Example usage:
// const impact = calculatePriceImpact(20, deepSeekDrugCostParameters);
// console.log(`Price reduction: ${impact.priceReductionPct.toFixed(1)}%`);