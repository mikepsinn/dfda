import { StratifiedParameter } from '../../../src/types';

export const patientCosts: StratifiedParameter = {
  id: 'patient_costs',
  parameterType: 'stratified',
  displayName: 'Per-Patient Trial Costs',
  defaultValue: 2.65, // Base cost per patient ($0.15 + $2.50)
  unitName: 'USD/patient',
  description: 'Total cost per patient including recruitment, data collection, and monitoring',
  sourceUrl: 'https://example.com',
  emoji: '👤',
  tags: ['patient', 'variable', 'operational'],
  metadata: {
    costCategory: 'variable',
    scalability: 'linear',
    components: ['recruitment', 'data-collection', 'monitoring']
  },

  // Stratification dimensions
  dimensions: ['cost_type', 'trial_phase', 'data_complexity'],
  
  // Possible values for each dimension
  stratification: {
    'cost_type': ['recruitment', 'data_collection', 'monitoring'],
    'trial_phase': ['phase_1', 'phase_2', 'phase_3', 'phase_4'],
    'data_complexity': ['basic', 'moderate', 'complex']
  },

  // Values for each combination
  values: {
    // Recruitment costs
    'recruitment:phase_1:basic': 0.15,
    'recruitment:phase_1:moderate': 0.20,
    'recruitment:phase_1:complex': 0.25,
    // ... more combinations ...
    'data_collection:phase_1:basic': 2.00,
    'data_collection:phase_1:moderate': 2.50,
    'data_collection:phase_1:complex': 3.00,
    // ... more combinations ...
    'monitoring:phase_1:basic': 0.50,
    'monitoring:phase_1:moderate': 0.75,
    'monitoring:phase_1:complex': 1.00
    // ... (would include all combinations)
  },

  // Aggregation functions
  aggregationFunctions: {
    byPhase: (values: number[]) => values.reduce((a, b) => a + b, 0),
    byType: (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length,
    totalCost: (values: number[]) => values.reduce((a, b) => a + b, 0)
  }
}; 