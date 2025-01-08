import { TimeSeriesParameter } from '../../../src/models/parameters/TimeSeriesParameter';
import { formatCurrency } from '../../../src/format';

// Generate time series data with decreasing costs over time due to economies of scale
const baseServerCost = 0.10; // $0.10 per patient for server costs
const baseAiMatchingCost = 0.05; // $0.05 per patient for AI matching
const baseDataCollectionCost = 2.50; // $2.50 per patient for data collection
const baseTotalCost = baseServerCost + baseAiMatchingCost + baseDataCollectionCost;

const timePoints = Array.from({ length: 60 }, (_, i) => {
  const monthlyScaleFactor = Math.pow(0.98, i); // 2% cost reduction per month from scale
  const value = baseTotalCost * monthlyScaleFactor;
  
  return {
    time: i,
    value,
    uncertainty: {
      standardError: value * 0.1, // 10% uncertainty
      confidenceInterval: [value * 0.8, value * 1.2] // 80-120% range
    }
  };
});

export const perPatientCosts = new TimeSeriesParameter(
  'per_patient_costs',
  'Per-Patient Processing Cost',
  baseTotalCost,
  'USD/patient',
  'Total cost per patient including server costs, AI matching, and data collection',
  'https://example.com/patient-costs',
  '👤',
  timePoints,
  'Based on cloud infrastructure costs and automated data processing systems',
  ['variable', 'per-patient', 'operational'],
  {
    costCategory: 'variable',
    phase: 'operational',
    complexity: 'low',
    riskLevel: 'low',
    components: {
      server: baseServerCost,
      aiMatching: baseAiMatchingCost,
      dataCollection: baseDataCollectionCost
    },
    scalingFactors: {
      volumeDiscount: 0.98, // 2% reduction per month
      automationBenefit: 0.95 // 5% reduction from automation
    },
    assumptions: [
      'Cloud costs decrease with volume',
      'Automation improves efficiency over time',
      'Data collection methods standardized'
    ]
  }
); 