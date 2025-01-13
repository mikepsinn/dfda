import { ModelParameter, OutcomeMetric } from './types';

export interface DiseaseCureModelParameters {
  lastCureYear: number;
  drugsApprovedPerYear: number;
  totalDiseases: number;
  developmentToAccessTime: number;
}

export class DiseaseCureModel {
  private parameters: DiseaseCureModelParameters;

  constructor(parameters: DiseaseCureModelParameters) {
    this.parameters = parameters;
  }

  /**
   * Calculate sensitivity ranges for key metrics
   */
  private calculateSensitivityRanges() {
    const probability = this.calculateCureProbability();
    const expectedTime = this.calculateExpectedCureTime();
    
    return {
      probability: {
        bestCase: probability * 1.2,
        worstCase: probability * 0.8
      },
      expectedTime: {
        bestCase: expectedTime * 0.8,
        worstCase: expectedTime * 1.5
      }
    };
  }

  public generateReport(): string {
    const currentYear = new Date().getFullYear();
    const cureProbability = this.calculateCureProbability();
    const expectedCureTime = this.calculateExpectedCureTime();
    const diseasesPerDrug = this.calculateDiseasesPerDrug();
    const yearsSinceLastCure = this.calculateYearsSinceLastCure(currentYear);
    const sensitivity = this.calculateSensitivityRanges();

    return `# Disease Cure Analysis Report

## Summary
Based on current drug development rates and historical data, this analysis provides insights into future disease cure timelines. The last major disease cure was ${yearsSinceLastCure} years ago in ${this.parameters.lastCureYear}.

## Key Statistics
- Probability of curing a random disease: ${(cureProbability * 100).toFixed(2)}% per year
  - Best case: ${(sensitivity.probability.bestCase * 100).toFixed(2)}%
  - Worst case: ${(sensitivity.probability.worstCase * 100).toFixed(2)}%
- Expected time until next cure: ${expectedCureTime.toFixed(1)} years
  - Best case: ${sensitivity.expectedTime.bestCase.toFixed(1)} years
  - Worst case: ${sensitivity.expectedTime.worstCase.toFixed(1)} years
- Diseases per approved drug: ${diseasesPerDrug.toFixed(1)}
- Years since last major cure: ${yearsSinceLastCure}

## Current Parameters
- Drugs Approved Per Year: ${this.parameters.drugsApprovedPerYear}
- Total Diseases Needing Cures: ${this.parameters.totalDiseases}
- Development to Access Time: ${this.parameters.developmentToAccessTime} years

## Calculation Details
- Cure Probability: Calculated by dividing annual drug approvals (${this.parameters.drugsApprovedPerYear}) by total diseases (${this.parameters.totalDiseases})
- Expected Cure Time: Inverse of cure probability (${(1/cureProbability).toFixed(1)} years) plus development time (${this.parameters.developmentToAccessTime} years)
- Note: These calculations currently assume each drug targets one disease. In reality, some drugs may treat multiple conditions.

## Methodology & Assumptions
1. Cure probability calculated using ratio of annual drug approvals to total diseases
2. Expected cure time accounts for both probability and development timeline
3. Sensitivity analysis considers:
   - Variations in drug approval success rates (±20%)
   - Potential development time fluctuations (-20%/+50%)
   - Multi-disease treatment potential
4. Key assumptions:
   - Linear relationship between drug approvals and cures
   - Uniform distribution of disease complexity
   - Consistent drug development timelines

## Implications
At current rates, we can expect the next disease cure between ${currentYear + Math.round(sensitivity.expectedTime.bestCase)} (best case) and ${currentYear + Math.round(sensitivity.expectedTime.worstCase)} (worst case). This timeline could be shortened through:
- Increased drug approval rates
- Reduced development and access times
- More efficient targeting of research efforts
- Development of multi-disease treatment approaches`;
  }

  /**
   * Calculate the probability of curing a random disease
   * Based on the rate of drug approvals and total diseases
   */
  calculateCureProbability(): number {
    const { drugsApprovedPerYear, totalDiseases } = this.parameters;
    // Assuming each drug can potentially cure one disease
    return drugsApprovedPerYear / totalDiseases;
  }

  /**
   * Calculate expected years until next disease cure
   * Accounts for development and access time
   */
  calculateExpectedCureTime(): number {
    const probability = this.calculateCureProbability();
    // Expected time is inverse of probability plus development time
    return (1 / probability) + this.parameters.developmentToAccessTime;
  }

  /**
   * Calculate average number of diseases addressed per approved drug
   */
  calculateDiseasesPerDrug(): number {
    const { drugsApprovedPerYear, totalDiseases } = this.parameters;
    return totalDiseases / drugsApprovedPerYear;
  }

  /**
   * Calculate years since last disease cure
   */
  calculateYearsSinceLastCure(currentYear: number = new Date().getFullYear()): number {
    return currentYear - this.parameters.lastCureYear;
  }

  // Outcome metrics for reporting
  static outcomeMetrics: Record<string, OutcomeMetric> = {
    cureProbability: {
      displayName: 'Cure Probability',
      description: 'Probability of curing a random disease based on current drug approval rates',
      emoji: '🎲',
      sourceUrl: '',
      modelParameters: [],
      generateDisplayValue: (value: number) => `${(value * 100).toFixed(1)}%`,
      calculateSensitivity: (value: number) => ({
        bestCase: value * 1.2,
        worstCase: value * 0.8,
        assumptions: [
          'Assumes linear relationship between drug approvals and cures',
          'Does not account for disease complexity variations',
          'Based on historical approval rates'
        ]
      }),
      generateCalculationExplanation: () => 
        `Calculated by dividing drugs approved per year (${this.modelParameters.drugsApprovedPerYear.defaultValue}) by total diseases (${this.modelParameters.totalDiseases.defaultValue})`
    },
    expectedCureTime: {
      displayName: 'Expected Cure Time',
      description: 'Expected years until next disease cure including development and access time',
      emoji: '⏳',
      sourceUrl: '',
      modelParameters: [],
      generateDisplayValue: (value: number) => `${value.toFixed(1)} years`,
      calculateSensitivity: (value: number) => ({
        bestCase: value * 0.8,
        worstCase: value * 1.5,
        assumptions: [
          'Assumes constant drug approval rates',
          'Includes average development and access time',
          'Based on historical development timelines'
        ]
      }),
      generateCalculationExplanation: () =>
        `Calculated as 1 / cure probability plus development to access time (${this.modelParameters.developmentToAccessTime.defaultValue} years)`
    },
    diseasesPerDrug: {
      displayName: 'Diseases per Drug',
      description: 'Average number of diseases addressed per approved drug',
      emoji: '💊',
      sourceUrl: '',
      modelParameters: [],
      generateDisplayValue: (value: number) => value.toFixed(1),
      calculateSensitivity: (value: number) => ({
        bestCase: value * 0.9,
        worstCase: value * 1.3,
        assumptions: [
          'Assumes uniform disease distribution',
          'Based on current disease count and approval rates',
          'Does not account for multi-indication drugs'
        ]
      }),
      generateCalculationExplanation: () =>
        `Calculated by dividing total diseases (${this.modelParameters.totalDiseases.defaultValue}) by drugs approved per year (${this.modelParameters.drugsApprovedPerYear.defaultValue})`
    }
  };

  // Model parameters for documentation and reporting
  static modelParameters: Record<string, ModelParameter> = {
    lastCureYear: {
      displayName: 'Last Cure Year',
      defaultValue: 1980,
      unitName: 'year',
      description: 'Year of last major disease cure',
      sourceUrl: '',
      emoji: '📅'
    },
    drugsApprovedPerYear: {
      displayName: 'Drugs Approved Per Year',
      defaultValue: 50,
      unitName: 'drugs/year',
      description: 'Average number of new drugs approved annually',
      sourceUrl: '',
      emoji: '💊'
    },
    totalDiseases: {
      displayName: 'Total Diseases',
      defaultValue: 2000,
      unitName: 'diseases',
      description: 'Total number of known diseases needing cures',
      sourceUrl: '',
      emoji: '🦠'
    },
    developmentToAccessTime: {
      displayName: 'Development to Access Time',
      defaultValue: 15,
      unitName: 'years',
      description: 'Time from cure development to patient access',
      sourceUrl: '',
      emoji: '⏳'
    }
  };
}
