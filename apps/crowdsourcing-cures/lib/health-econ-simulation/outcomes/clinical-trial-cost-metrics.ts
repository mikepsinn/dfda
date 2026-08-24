import { OutcomeMetric } from '../types';
import { clinicalTrialParameters } from './clinical-trial-cost-model';

export const clinicalTrialOutcomeMetrics: Record<string, OutcomeMetric> = {
  price_impact: {
    displayName: "Potential Drug Price Reduction",
    description: "Estimated reduction in final drug price based on R&D cost savings",
    emoji: "🏷️",
    sourceUrl: "https://jamanetwork.com/journals/jama/fullarticle/2762311",
    modelParameters: [clinicalTrialParameters.markup_factor],
    generateDisplayValue: (value: number) => `$${(value / 1000000).toFixed(1)}M`,
    calculateSensitivity: (reduction: number, baselineMetrics: Record<string, number>) => {
      const savings = baselineMetrics.average_trial_cost * (reduction / 100);
      
      // Apply therapeutic area-specific factors
      const oncologyFactor = 0.6; // 40% less price reduction for oncology
      const rareDiseaseFactor = 0.9; // 10% less price reduction for rare diseases
      const generalFactor = 0.7; // Standard 30% less price reduction
      
      // Apply payer negotiation factors
      const payerNegotiation = {
        oncology: 0.5, // 50% of savings passed through for oncology
        rareDisease: 0.7, // 70% of savings passed through for rare diseases
        general: 0.6 // 60% of savings passed through for other areas
      };
      
      // Calculate effective savings for each therapeutic area
      const oncologySavings = savings * oncologyFactor * payerNegotiation.oncology;
      const rareDiseaseSavings = savings * rareDiseaseFactor * payerNegotiation.rareDisease;
      const generalSavings = savings * generalFactor * payerNegotiation.general;
      
      // Calculate price ceilings based on therapeutic area
      const priceCeiling = {
        oncology: 0.15, // Maximum 15% price reduction for oncology
        rareDisease: 0.25, // Maximum 25% price reduction for rare diseases
        general: 0.2 // Maximum 20% price reduction for other areas
      };
      
      // Calculate best/worst cases for each therapeutic area
      const bestCase = Math.min(
        Math.max(
          oncologySavings * 1.15 * baselineMetrics.markup_factor,
          rareDiseaseSavings * 1.15 * baselineMetrics.markup_factor,
          generalSavings * 1.15 * baselineMetrics.markup_factor
        ),
        Math.max(
          baselineMetrics.average_trial_cost * priceCeiling.oncology,
          baselineMetrics.average_trial_cost * priceCeiling.rareDisease,
          baselineMetrics.average_trial_cost * priceCeiling.general
        )
      );
      
      const worstCase = Math.min(
        Math.max(
          oncologySavings * 0.85 * baselineMetrics.markup_factor,
          rareDiseaseSavings * 0.85 * baselineMetrics.markup_factor,
          generalSavings * 0.85 * baselineMetrics.markup_factor
        ),
        Math.max(
          baselineMetrics.average_trial_cost * priceCeiling.oncology,
          baselineMetrics.average_trial_cost * priceCeiling.rareDisease,
          baselineMetrics.average_trial_cost * priceCeiling.general
        )
      );
      
      return {
        bestCase,
        worstCase,
        assumptions: [
          "Accounts for therapeutic area-specific price reduction factors",
          "Oncology: 60% efficiency, 50% payer pass-through, 15% max reduction",
          "Rare Diseases: 90% efficiency, 70% payer pass-through, 25% max reduction",
          "General: 70% efficiency, 60% payer pass-through, 20% max reduction",
          "Includes variability in payer negotiations and market conditions"
        ]
      };
    },
    generateCalculationExplanation: (reduction: number, baselineMetrics: Record<string, number>) => `
      <p>Price impact is calculated by multiplying cost savings by the R&D markup factor:</p>
      <div class="formula">
        Cost Savings: $${((baselineMetrics.average_trial_cost * reduction / 100) / 1000000).toFixed(1)}M<br>
        Markup Factor: ${baselineMetrics.markup_factor}x<br>
        Price Impact: $${((baselineMetrics.average_trial_cost * reduction / 100 * baselineMetrics.markup_factor) / 1000000).toFixed(1)}M
      </div>
    `
  }
};
