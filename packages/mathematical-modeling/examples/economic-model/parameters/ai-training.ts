import { StochasticParameter } from '../../../src/types';
import { formatCurrency } from '../../../src/format';

export const aiTraining: StochasticParameter = {
  id: 'ai_training',
  parameterType: 'stochastic',
  displayName: 'AI Model Training Cost',
  defaultValue: 10_000_000,
  unitName: 'USD',
  description: 'One-time cost for training AI models for patient matching, analysis, and monitoring',
  sourceUrl: 'https://example.com',
  emoji: '🧠',
  sourceQuote: 'Training large language models can cost between $1M to $20M depending on model size and complexity',
  generateDisplayValue: (value: number) => formatCurrency(value),
  tags: ['one-time', 'ai', 'training'],
  metadata: {
    costCategory: 'fixed',
    phase: 'initial',
    complexity: 'high',
    modelArchitecture: 'transformer',
    computeRequirements: {
      gpuHours: 100000,
      gpuType: 'A100',
      dataSize: '1PB'
    }
  },
  
  // Statistical properties
  distributionType: 'lognormal',
  distributionParameters: {
    mu: Math.log(10_000_000), // median
    sigma: 0.3 // Higher uncertainty than development costs
  },
  sampleSize: 10000,
  seed: 12346,
  
  // Correlations with other costs
  correlations: {
    'initial_development': 0.5,
    'ai_inference': -0.6 // Higher training cost -> lower inference cost
  }
}; 