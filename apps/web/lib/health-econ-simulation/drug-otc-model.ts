import { ModelParameter, OutcomeMetric } from './types';
import { findOrCreateArticleByPromptedTopic } from '@/lib/agents/researcher/researcher';

// Model parameters for OTC vs Prescription analysis
export const drugOTCModelParameters = {
  // Clinical parameters
  adverseEventRate: {
    displayName: 'Adverse Event Rate',
    defaultValue: 0.02, // 2% baseline
    unitName: 'percentage',
    description: 'Rate of adverse events under prescription-only access',
    sourceUrl: 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-adverse-event-reporting-system-faers',
    emoji: '⚠️'
  },
  
  accessibilityIncrease: {
    displayName: 'Accessibility Increase',
    defaultValue: 0.35, // 35% more people can access
    unitName: 'percentage',
    description: 'Expected increase in accessibility when switched to OTC',
    sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3278188/',
    emoji: '🔓'
  },

  adherenceChange: {
    displayName: 'Adherence Change',
    defaultValue: -0.1, // 10% decrease without doctor oversight
    unitName: 'percentage',
    description: 'Expected change in medication adherence when switched to OTC',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/24512277/',
    emoji: '📊'
  },

  // Economic parameters
  prescriptionCost: {
    displayName: 'Prescription Visit Cost',
    defaultValue: 150, // Average doctor visit cost
    unitName: 'USD',
    description: 'Average cost of doctor visit for prescription',
    sourceUrl: 'https://www.kff.org/health-costs/issue-brief/americans-challenges-with-health-care-costs/',
    emoji: '💰'
  },

  annualPrescriptionVolume: {
    displayName: 'Annual Prescription Volume',
    defaultValue: 1000000, // Example: 1 million prescriptions
    unitName: 'prescriptions',
    description: 'Annual number of prescriptions written',
    sourceUrl: 'https://www.cdc.gov/nchs/fastats/drug-use-therapeutic.htm',
    emoji: '📈'
  },

  marketCompetitionEffect: {
    displayName: 'Market Competition Effect',
    defaultValue: 0.25, // 25% price reduction from competition
    unitName: 'percentage',
    description: 'Expected price reduction due to market competition in OTC',
    sourceUrl: 'https://www.ftc.gov/sites/default/files/documents/reports/how-drug-switching-affects-consumers-prescription-drug-prices/price_effects_rx_otc.pdf',
    emoji: '🏪'
  },

  emergencyVisitCost: {
    displayName: 'Emergency Visit Cost',
    defaultValue: 1200, // Average ER visit cost
    unitName: 'USD',
    description: 'Average cost of emergency room visit for adverse events',
    sourceUrl: 'https://www.cms.gov/Research-Statistics-Data-and-Systems/Statistics-Trends-and-Reports/Medicare-Provider-Charge-Data/Outpatient',
    emoji: '🏥'
  }
} satisfies Record<string, ModelParameter>;

// Function to update model parameters with real research data
export async function updateModelParametersWithResearch(drugName: string, userId: string) {
  // Research queries for each parameter
  const researchQueries = {
    adverseEventRate: `What is the adverse event rate for ${drugName} in prescription form? Focus on FDA FAERS data and clinical studies.`,
    accessibilityIncrease: `What is the increase in accessibility when drugs switch from prescription to OTC? Use data from similar drug switches.`,
    adherenceChange: `How does medication adherence change when drugs switch from prescription to OTC? Use real studies and meta-analyses.`,
    prescriptionCost: `What is the average cost of a doctor visit for prescription in the US? Use recent healthcare cost data.`,
    annualPrescriptionVolume: `What is the annual prescription volume for ${drugName} in the US? Use FDA or CDC prescription data.`,
    marketCompetitionEffect: `What is the average price reduction when drugs switch to OTC? Use FTC and market research data.`,
    emergencyVisitCost: `What is the average emergency room visit cost in the US? Use CMS or hospital cost data.`
  };

  const updatedParameters = { ...drugOTCModelParameters };
  
  // Research each parameter
  for (const [param, query] of Object.entries(researchQueries)) {
    try {
      const article = await findOrCreateArticleByPromptedTopic(query, userId, {
        numberOfSearchQueryVariations: 2,
        numberOfWebResultsToInclude: 5,
        format: "bullet-points",
        purpose: "find specific statistics",
        searchStrategy: "focused"
      });

      // Extract the first number found in the content that looks like a percentage or dollar amount
      const content = article.content;
      let value: number | null = null;
      
      if (param.includes('cost')) {
        // Look for dollar amounts
        const match = content.match(/\$?([\d,]+(?:\.\d{1,2})?)/);
        if (match) {
          value = parseFloat(match[1].replace(/,/g, ''));
        }
      } else if (param.includes('Rate') || param.includes('Change') || param.includes('Increase') || param.includes('Effect')) {
        // Look for percentages
        const match = content.match(/(\d+(?:\.\d{1,2})?)\s*%/);
        if (match) {
          value = parseFloat(match[1]) / 100; // Convert percentage to decimal
        }
      } else {
        // Look for plain numbers
        const match = content.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/);
        if (match) {
          value = parseFloat(match[1].replace(/,/g, ''));
        }
      }

      if (value !== null && param in updatedParameters) {
        updatedParameters[param as keyof typeof drugOTCModelParameters] = {
          ...updatedParameters[param as keyof typeof drugOTCModelParameters],
          defaultValue: value,
          sourceUrl: article.sources[0]?.url || updatedParameters[param as keyof typeof drugOTCModelParameters].sourceUrl
        };
      }
    } catch (error) {
      console.error(`Error researching ${param}:`, error);
    }
  }

  return updatedParameters;
}

// Outcome metrics for the analysis
export const otcOutcomeMetrics: Record<string, OutcomeMetric> = {
  accessibilityBenefit: {
    displayName: 'Accessibility Benefit',
    description: 'Economic benefit from increased access to medication',
    emoji: '🔓',
    sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3278188/',
    modelParameters: [
      drugOTCModelParameters.accessibilityIncrease,
      drugOTCModelParameters.prescriptionCost,
      drugOTCModelParameters.annualPrescriptionVolume
    ],
    generateDisplayValue: (value: number) => `$${value.toLocaleString()} in accessibility savings`,
    calculateSensitivity: (value: number, baselineMetrics: Record<string, number>) => ({
      bestCase: value * 1.2,
      worstCase: value * 0.8,
      assumptions: [
        'Assumes linear relationship between access and benefit',
        'Does not account for regional variations in healthcare access',
        'Based on historical OTC conversion data'
      ]
    }),
    generateCalculationExplanation: (value: number, baselineMetrics: Record<string, number>) => 
      `Calculated by multiplying the increase in accessibility (${drugOTCModelParameters.accessibilityIncrease.defaultValue * 100}%) by the cost savings per prescription ($${drugOTCModelParameters.prescriptionCost.defaultValue}) and annual volume (${drugOTCModelParameters.annualPrescriptionVolume.defaultValue.toLocaleString()} prescriptions)`
  },

  safetyRiskCost: {
    displayName: 'Safety Risk Cost',
    description: 'Economic cost from potential adverse events',
    emoji: '⚠️',
    sourceUrl: 'https://www.fda.gov/drugs/drug-safety-and-availability',
    modelParameters: [
      drugOTCModelParameters.adverseEventRate,
      drugOTCModelParameters.emergencyVisitCost,
      drugOTCModelParameters.annualPrescriptionVolume
    ],
    generateDisplayValue: (value: number) => `$${value.toLocaleString()} in safety-related costs`,
    calculateSensitivity: (value: number, baselineMetrics: Record<string, number>) => ({
      bestCase: value * 0.7,
      worstCase: value * 1.5,
      assumptions: [
        'Assumes reported adverse events capture majority of incidents',
        'Based on historical safety data from similar OTC conversions',
        'Includes only direct medical costs'
      ]
    }),
    generateCalculationExplanation: (value: number, baselineMetrics: Record<string, number>) =>
      `Calculated by multiplying the adverse event rate (${drugOTCModelParameters.adverseEventRate.defaultValue * 100}%) by emergency visit cost ($${drugOTCModelParameters.emergencyVisitCost.defaultValue}) and affected population`
  },

  marketCompetitionBenefit: {
    displayName: 'Market Competition Benefit',
    description: 'Economic benefit from increased market competition',
    emoji: '📊',
    sourceUrl: 'https://www.ftc.gov/sites/default/files/documents/reports/how-drug-switching-affects-consumers-prescription-drug-prices',
    modelParameters: [
      drugOTCModelParameters.marketCompetitionEffect,
      drugOTCModelParameters.annualPrescriptionVolume
    ],
    generateDisplayValue: (value: number) => `$${value.toLocaleString()} in price reduction benefits`,
    calculateSensitivity: (value: number, baselineMetrics: Record<string, number>) => ({
      bestCase: value * 1.3,
      worstCase: value * 0.6,
      assumptions: [
        'Assumes competitive market conditions',
        'Based on historical price changes in OTC conversions',
        'Does not account for potential market consolidation'
      ]
    }),
    generateCalculationExplanation: (value: number, baselineMetrics: Record<string, number>) =>
      `Calculated by applying market competition effect (${drugOTCModelParameters.marketCompetitionEffect.defaultValue * 100}% price reduction) to annual prescription volume`
  }
};

export interface DrugAnalysisConfig {
  drugName: string;
  currentPrice: number;
  annualVolume?: number;
  adverseEventRate?: number;
  expectedAccessibilityIncrease?: number;
  expectedAdherenceChange?: number;
}

export class DrugOTCAnalysisModel {
  private parameters: typeof drugOTCModelParameters;
  private config: DrugAnalysisConfig;

  constructor(config: DrugAnalysisConfig, customParameters?: Partial<typeof drugOTCModelParameters>) {
    this.config = config;
    this.parameters = {
      ...drugOTCModelParameters,
      ...customParameters
    };

    // Override defaults with config values
    if (config.annualVolume) {
      this.parameters.annualPrescriptionVolume.defaultValue = config.annualVolume;
    }
    if (config.adverseEventRate) {
      this.parameters.adverseEventRate.defaultValue = config.adverseEventRate;
    }
    if (config.expectedAccessibilityIncrease) {
      this.parameters.accessibilityIncrease.defaultValue = config.expectedAccessibilityIncrease;
    }
    if (config.expectedAdherenceChange) {
      this.parameters.adherenceChange.defaultValue = config.expectedAdherenceChange;
    }
  }

  calculateAccessibilityBenefit(): number {
    const accessIncrease = this.parameters.accessibilityIncrease.defaultValue;
    const visitCost = this.parameters.prescriptionCost.defaultValue;
    const volume = this.parameters.annualPrescriptionVolume.defaultValue;
    
    return accessIncrease * visitCost * volume;
  }

  calculateSafetyRiskCost(): number {
    const adverseRate = this.parameters.adverseEventRate.defaultValue;
    const emergencyCost = this.parameters.emergencyVisitCost.defaultValue;
    const volume = this.parameters.annualPrescriptionVolume.defaultValue;
    
    return adverseRate * emergencyCost * volume;
  }

  calculateMarketCompetitionBenefit(): number {
    const competitionEffect = this.parameters.marketCompetitionEffect.defaultValue;
    const volume = this.parameters.annualPrescriptionVolume.defaultValue;
    const currentPrice = this.config.currentPrice;
    
    return competitionEffect * currentPrice * volume;
  }

  calculateNetBenefit(): {
    netBenefit: number;
    benefits: Record<string, number>;
    costs: Record<string, number>;
    summary: string;
  } {
    const benefits = {
      accessibility: this.calculateAccessibilityBenefit(),
      marketCompetition: this.calculateMarketCompetitionBenefit()
    };

    const costs = {
      safetyRisk: this.calculateSafetyRiskCost()
    };

    const totalBenefits = Object.values(benefits).reduce((a, b) => a + b, 0);
    const totalCosts = Object.values(costs).reduce((a, b) => a + b, 0);
    const netBenefit = totalBenefits - totalCosts;

    return {
      netBenefit,
      benefits,
      costs,
      summary: `Converting ${this.config.drugName} to OTC status would result in a net ${
        netBenefit >= 0 ? 'benefit' : 'cost'
      } of $${Math.abs(netBenefit).toLocaleString()}`
    };
  }

  generateReport(): string {
    const analysis = this.calculateNetBenefit();
    const sensitivity = {
      bestCase: analysis.netBenefit * 1.2,
      worstCase: analysis.netBenefit * 0.8
    };

    return `
# OTC Conversion Analysis for ${this.config.drugName}

## Summary
${analysis.summary}

## Benefits
- Accessibility: $${analysis.benefits.accessibility.toLocaleString()}
- Market Competition: $${analysis.benefits.marketCompetition.toLocaleString()}

## Costs
- Safety Risks: $${analysis.costs.safetyRisk.toLocaleString()}

## Sensitivity Analysis
- Best Case: $${sensitivity.bestCase.toLocaleString()}
- Worst Case: $${sensitivity.worstCase.toLocaleString()}

## Key Assumptions
- Adverse event rate: ${this.parameters.adverseEventRate.defaultValue * 100}%
- Accessibility increase: ${this.parameters.accessibilityIncrease.defaultValue * 100}%
- Market competition effect: ${this.parameters.marketCompetitionEffect.defaultValue * 100}%
- Annual prescription volume: ${this.parameters.annualPrescriptionVolume.defaultValue.toLocaleString()}
`;
  }
}

// Example usage:
/*
const analysis = new DrugOTCAnalysisModel({
  drugName: "ExampleDrug",
  currentPrice: 100,
  annualVolume: 1000000
});

const report = analysis.generateReport();
console.log(report);
*/
