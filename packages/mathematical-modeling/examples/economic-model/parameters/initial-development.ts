import { StochasticParameter } from '../../../src/models/parameters/StochasticParameter';
import { formatCurrency } from '../../../src/format';

export const initialDevelopment = new StochasticParameter(
  'initial_development',
  'Initial Development Cost',
  50_000_000,
  'USD',
  'One-time cost for platform development including infrastructure setup, security compliance, and initial testing',
  'https://example.com',
  '💻',
  'normal',
  {
    mean: 50_000_000,
    standardDeviation: 10_000_000 // 20% of mean
  },
  10000,
  'Average cost of clinical trials ranges from $2,211 per patient for basic studies to millions for complex trials',
  ['one-time', 'development', 'infrastructure'],
  {
    costCategory: 'fixed',
    phase: 'initial',
    complexity: 'high',
    riskLevel: 'medium',
    correlations: {
      'annual_maintenance': 0.7, // Higher initial cost -> higher maintenance
      'ai_training': 0.5 // Some correlation with AI costs
    }
  }
);
