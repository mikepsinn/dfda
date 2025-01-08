import { OutcomeMetric } from '../../../src/types';
import * as parameters from '../parameters';

function formatCurrency(value: number, scale: 'millions' | 'none' = 'millions'): string {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }

  const scaledValue = scale === 'millions' ? value / 1_000_000 : value;
  const formatted = scaledValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `$${formatted}${scale === 'millions' ? 'M' : ''}`;
}

export const totalCost: OutcomeMetric = {
  id: 'total_cost',
  type: 'outcome',
  displayName: 'Total Cost',
  defaultValue: 0,
  unitName: 'USD',
  description: 'Total cost of running trials including platform costs and per-trial costs',
  sourceUrl: 'https://example.com',
  emoji: '💰',
  tags: ['financial', 'aggregate', 'primary-outcome'],
  metadata: {
    category: 'financial',
    aggregationType: 'sum',
    timeframe: '5-year',
    components: ['platform', 'trials', 'operations']
  },
  modelParameters: Object.values(parameters),

  // Core calculation
  calculate: (params: Record<string, number>) => {
    // Platform costs
    const platformCosts = params.initial_development + params.ai_training;
    
    // Annual costs over 5 years
    const annualCosts = params.annual_maintenance * 5;
    
    // Per-trial costs (assuming 1000 trials/year * 5 years)
    const trialsCount = 5000;
    const patientsPerTrial = 1000;
    
    const perTrialCosts = (
      // Patient costs
      (params.patient_costs * patientsPerTrial) +
      // Regulatory compliance
      params.regulatory_compliance +
      // AI inference costs (with volume discount via scaling function)
      (params.ai_inference * patientsPerTrial)
    ) * trialsCount;

    return platformCosts + annualCosts + perTrialCosts;
  },

  generateCalculationExplanation: (params: Record<string, number>) => {
    // Platform costs
    const platformCosts = params.initial_development + params.ai_training;
    
    // Annual costs over 5 years
    const annualCosts = params.annual_maintenance * 5;
    
    // Per-trial costs (5000 trials)
    const trialsCount = 5000;
    const perTrialCosts = params.regulatory_compliance * trialsCount;
    
    // Per-patient costs (5M patients)
    const totalPatients = trialsCount * 1000;
    const perPatientCosts = (params.patient_costs + params.ai_inference) * totalPatients;

    return `Total cost calculated as:
    Platform Setup: ${formatCurrency(platformCosts)}
    Annual Costs (5 years): ${formatCurrency(annualCosts)}
    Per-trial Costs (${trialsCount.toLocaleString()} trials): ${formatCurrency(perTrialCosts)}
    Per-patient Costs (${totalPatients.toLocaleString()} patients): ${formatCurrency(perPatientCosts)}`;
  },

  // Analysis methods
  sensitivity: {
    type: 'global',
    calculate: (params: Record<string, number>) => ({
      method: 'sobol',
      results: Object.entries(params).reduce((acc, [key, value]) => {
        acc[key] = {
          value,
          impact: value / Object.values(params).reduce((sum, v) => sum + v, 0),
          rank: 0 // Would be calculated based on impact
        };
        return acc;
      }, {} as Record<string, { value: number; impact: number; rank: number }>),
      visualizations: {
        type: 'tornado',
        data: {} // Would contain visualization data
      }
    })
  },

  uncertainty: {
    type: 'monte_carlo',
    calculate: (params: Record<string, number>) => ({
      method: 'monte_carlo',
      summary: {
        mean: Object.values(params).reduce((sum, v) => sum + v, 0),
        median: 0, // Would be calculated from simulation
        standardDeviation: 0, // Would be calculated from simulation
        confidenceInterval: [0, 0], // Would be calculated from simulation
        percentiles: {
          25: 0,
          75: 0,
          95: 0
        }
      },
      distribution: {
        type: 'lognormal',
        parameters: {
          mu: 0,
          sigma: 0
        }
      },
      samples: [] // Would contain simulation results
    })
  },

  timeSeries: {
    resolution: 'monthly',
    calculate: (params: Record<string, number>) => ({
      timePoints: Array.from({ length: 60 }, (_, i) => i + 1),
      values: Array.from({ length: 60 }, (_, i) => {
        const month = i + 1;
        const year = Math.floor(month / 12);
        return (
          // One-time costs in first month
          (month === 1 ? params.initial_development + params.ai_training : 0) +
          // Monthly maintenance
          params.annual_maintenance / 12 +
          // Monthly trial costs
          (params.regulatory_compliance * (1000 / 12)) +
          // Monthly patient costs
          (params.patient_costs + params.ai_inference) * (1000000 / 12)
        );
      }),
      metadata: {
        seasonalComponents: [], // Would contain seasonal adjustments
        trendComponent: [], // Would contain trend analysis
        residuals: [], // Would contain residuals
        fitMetrics: {
          r2: 0,
          rmse: 0
        }
      }
    })
  },

  stratification: {
    dimensions: ['region', 'trial_phase', 'therapeutic_area'],
    calculate: (params: Record<string, number>, strata: string[]) => ({
      overall: Object.values(params).reduce((sum, v) => sum + v, 0),
      strata: {
        'us_phase1': {
          value: 0, // Would be calculated based on stratification
          sampleSize: 0,
          uncertainty: {
            standardError: 0,
            confidenceInterval: [0, 0]
          }
        }
        // Would include all strata combinations
      },
      decomposition: {
        betweenGroupVariance: 0,
        withinGroupVariance: 0,
        explainedVariance: 0
      }
    })
  }
};
