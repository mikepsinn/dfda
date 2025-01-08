import { OutcomeMetric, ModelParameter } from '../../../src/types';
import { formatCurrency, formatPercent } from '../../../src/format';
import * as parameters from '../parameters';

// Efficiency scaling functions
function getVolumeDiscount(volume: number): number {
  // Logarithmic scaling: each 10x increase in volume gives additional 10% discount
  // Max discount of 50%
  const discount = Math.min(0.5, Math.log10(volume) * 0.1);
  return 1 - discount;
}

function getAutomationEfficiency(aiSpend: number): number {
  // More AI spend = better efficiency
  // Returns a number between 0.5 (50% cost reduction) and 1 (no reduction)
  return Math.max(0.5, 1 - Math.log10(aiSpend) * 0.05);
}

function getParameterValue(param: ModelParameter): number {
  return param.defaultValue; // For now just use defaultValue, we'll handle actual values later
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
  generateDisplayValue: (value: number) => formatCurrency(value),
  metadata: {
    category: 'financial',
    aggregationType: 'sum',
    timeframe: '5-year',
    components: ['platform', 'trials', 'operations']
  },
  modelParameters: Object.values(parameters),

  // Core calculation
  calculate: (params: Record<string, ModelParameter>) => {
    // Platform costs (one-time)
    const platformCosts = getParameterValue(params.initial_development) + 
      getParameterValue(params.ai_training);
    
    // Annual costs over 5 years (with efficiency gains)
    const annualCosts = getParameterValue(params.annual_maintenance) * 5 * 
      getAutomationEfficiency(getParameterValue(params.ai_training));
    
    // Trial parameters
    const trialsCount = 5000; // 1000 trials/year * 5 years
    const patientsPerTrial = 1000;
    const totalPatients = trialsCount * patientsPerTrial;

    // Per-trial costs with volume discounts
    const regulatoryPerTrial = getParameterValue(params.regulatory_compliance) * 
      getVolumeDiscount(trialsCount) * 
      getAutomationEfficiency(getParameterValue(params.ai_training));
    const perTrialCosts = regulatoryPerTrial * trialsCount;

    // Per-patient costs with volume discounts
    const patientCostWithDiscount = getParameterValue(params.patient_costs) * getVolumeDiscount(totalPatients);
    const aiCostWithDiscount = getParameterValue(params.ai_inference) * getVolumeDiscount(totalPatients);
    const perPatientCosts = (patientCostWithDiscount + aiCostWithDiscount) * totalPatients;

    return platformCosts + annualCosts + perTrialCosts + perPatientCosts;
  },

  generateCalculationExplanation: (params: Record<string, ModelParameter>) => {
    // Platform costs
    const platformCosts = getParameterValue(params.initial_development) + 
      getParameterValue(params.ai_training);
    
    // Annual costs with efficiency
    const annualEfficiency = getAutomationEfficiency(getParameterValue(params.ai_training));
    const annualCosts = getParameterValue(params.annual_maintenance) * 5 * annualEfficiency;
    
    // Trial parameters
    const trialsCount = 5000;
    const patientsPerTrial = 1000;
    const totalPatients = trialsCount * patientsPerTrial;

    // Per-trial costs with discounts
    const trialVolumeDiscount = getVolumeDiscount(trialsCount);
    const regulatoryPerTrial = getParameterValue(params.regulatory_compliance) * trialVolumeDiscount * annualEfficiency;
    const perTrialCosts = regulatoryPerTrial * trialsCount;

    // Per-patient costs with discounts
    const patientVolumeDiscount = getVolumeDiscount(totalPatients);
    const patientCostWithDiscount = getParameterValue(params.patient_costs) * patientVolumeDiscount;
    const aiCostWithDiscount = getParameterValue(params.ai_inference) * patientVolumeDiscount;
    const perPatientCosts = (patientCostWithDiscount + aiCostWithDiscount) * totalPatients;

    // Use each parameter's own display value generator
    const displayPlatformCosts = params.initial_development.generateDisplayValue(getParameterValue(params.initial_development)) + 
      ' + ' + params.ai_training.generateDisplayValue(getParameterValue(params.ai_training));
    const displayAnnualCosts = params.annual_maintenance.generateDisplayValue(getParameterValue(params.annual_maintenance));
    const displayRegulatoryPerTrial = params.regulatory_compliance.generateDisplayValue(getParameterValue(params.regulatory_compliance));
    const displayPatientCosts = params.patient_costs.generateDisplayValue(getParameterValue(params.patient_costs));
    const displayAiCosts = params.ai_inference.generateDisplayValue(getParameterValue(params.ai_inference));

    return `Total cost calculated as:
    Platform Setup (${displayPlatformCosts}): ${formatCurrency(platformCosts)}
    Annual Costs (${displayAnnualCosts} × 5 years, ${formatPercent(1 - annualEfficiency)} efficiency gain): ${formatCurrency(annualCosts)}
    Per-trial Costs (${trialsCount.toLocaleString()} trials at ${displayRegulatoryPerTrial}/trial, ${formatPercent(1 - trialVolumeDiscount)} volume discount): ${formatCurrency(perTrialCosts)}
    Per-patient Costs (${totalPatients.toLocaleString()} patients at ${displayPatientCosts}/patient + ${displayAiCosts}/interaction, ${formatPercent(1 - patientVolumeDiscount)} volume discount): ${formatCurrency(perPatientCosts)}`;
  },

  // Analysis methods
  sensitivity: {
    type: 'global',
    calculate: (params: Record<string, ModelParameter>) => ({
      method: 'sobol',
      results: Object.entries(params).reduce((acc, [key, param]) => {
        const value = getParameterValue(param);
        acc[key] = {
          value,
          impact: value / Object.values(params).reduce((sum, p) => sum + getParameterValue(p), 0),
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
    calculate: (params: Record<string, ModelParameter>) => ({
      method: 'monte_carlo',
      summary: {
        mean: Object.values(params).reduce((sum, p) => sum + getParameterValue(p), 0),
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
    calculate: (params: Record<string, ModelParameter>) => ({
      timePoints: Array.from({ length: 60 }, (_, i) => i + 1),
      values: Array.from({ length: 60 }, (_, i) => {
        const month = i + 1;
        return (
          // One-time costs in first month
          (month === 1 ? getParameterValue(params.initial_development) + getParameterValue(params.ai_training) : 0) +
          // Monthly maintenance
          getParameterValue(params.annual_maintenance) / 12 +
          // Monthly trial costs
          (getParameterValue(params.regulatory_compliance) * (1000 / 12)) +
          // Monthly patient costs
          (getParameterValue(params.patient_costs) + getParameterValue(params.ai_inference)) * (1000000 / 12)
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
    calculate: (params: Record<string, ModelParameter>, strata: string[]) => ({
      overall: Object.values(params).reduce((sum, p) => sum + getParameterValue(p), 0),
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
