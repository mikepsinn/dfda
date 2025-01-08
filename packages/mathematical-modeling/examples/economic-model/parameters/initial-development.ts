import { StochasticParameter } from '../../../src/types';

export const initialDevelopment: StochasticParameter = {
  id: 'initial_development',
  parameterType: 'stochastic',
  displayName: 'Initial Development Cost',
  defaultValue: 50_000_000,
  unitName: 'USD',
  description: 'One-time cost for platform development including infrastructure setup, security compliance, and initial testing',
  sourceUrl: 'https://example.com',
  emoji: '💻',
  sourceQuote: 'Average cost of clinical trials ranges from $2,211 per patient for basic studies to millions for complex trials',
  tags: ['platform', 'development', 'infrastructure'],
  metadata: {
    costCategory: 'fixed',
    phase: 'initial',
    complexity: 'high',
    riskLevel: 'medium'
  },
  
  // Statistical properties based on industry data
  distributionType: 'lognormal',
  distributionParameters: {
    mu: Math.log(50_000_000), // median
    sigma: 0.2 // implies about ±20% variation
  },
  sampleSize: 10000,
  seed: 12345,
  
  // Correlations with other costs
  correlations: {
    'annual_maintenance': 0.7, // Higher initial cost -> higher maintenance
    'ai_training': 0.5 // Some correlation with AI costs
  }
};
