import { StratifiedParameter } from '../../../src/types';
import { formatCurrency } from '../../../src/format';

export const regulatoryCompliance: StratifiedParameter = {
  id: 'regulatory_compliance',
  parameterType: 'stratified',
  displayName: 'Regulatory Compliance Cost',
  defaultValue: 200_000,
  unitName: 'USD/trial',
  description: 'Regulatory compliance costs including documentation, monitoring, and reporting',
  sourceUrl: 'https://example.com',
  emoji: '📋',
  generateDisplayValue: (value: number) => formatCurrency(value) + '/trial',
  tags: ['variable', 'regulatory', 'compliance', 'per-trial'],
  metadata: {
    costCategory: 'variable',
    scalability: 'step-wise',
    components: ['documentation', 'monitoring', 'reporting'],
    automationLevel: 'high'
  },

  // Stratification dimensions
  dimensions: ['region', 'trial_phase', 'component', 'complexity'],
  
  // Possible values for each dimension
  stratification: {
    'region': ['us', 'eu', 'asia', 'row'],
    'trial_phase': ['phase_1', 'phase_2', 'phase_3', 'phase_4'],
    'component': ['documentation', 'monitoring', 'reporting'],
    'complexity': ['standard', 'complex', 'novel_therapy']
  },

  // Values for each combination (example subset)
  values: {
    // US Phase 1
    'us:phase_1:documentation:standard': 50000,
    'us:phase_1:monitoring:standard': 25000,
    'us:phase_1:reporting:standard': 25000,
    'us:phase_1:documentation:complex': 75000,
    'us:phase_1:monitoring:complex': 35000,
    'us:phase_1:reporting:complex': 35000,
    'us:phase_1:documentation:novel_therapy': 100000,
    'us:phase_1:monitoring:novel_therapy': 50000,
    'us:phase_1:reporting:novel_therapy': 50000,

    // EU Phase 1 (slightly higher due to additional requirements)
    'eu:phase_1:documentation:standard': 60000,
    'eu:phase_1:monitoring:standard': 30000,
    'eu:phase_1:reporting:standard': 30000,
    // ... would continue for all combinations
  },

  // Aggregation functions
  aggregationFunctions: {
    byRegion: (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length,
    byPhase: (values: number[]) => values.reduce((a, b) => a + b, 0),
    byComponent: (values: number[]) => values.reduce((a, b) => a + b, 0),
    totalCost: (values: number[]) => values.reduce((a, b) => a + b, 0),
  }
}; 