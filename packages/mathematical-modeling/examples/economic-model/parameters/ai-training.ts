import { StochasticParameter } from '../../../src/models/parameters/StochasticParameter';
import { formatCurrency } from '../../../src/format';

export const aiTraining = new StochasticParameter(
  'ai_training',
  'AI Model Training Cost',
  10_000_000,
  'USD',
  'One-time cost for training the AI models for patient matching, safety monitoring, and outcome analysis',
  'https://example.com/ai-costs',
  '🧠',
  'normal',
  {
    mean: 10_000_000,
    standardDeviation: 2_000_000 // 20% uncertainty
  },
  10000,
  'Based on industry standards for large-scale ML model training and deployment',
  ['one-time', 'ai', 'training'],
  {
    costCategory: 'fixed',
    phase: 'initial',
    complexity: 'high',
    riskLevel: 'medium',
    components: [
      'patient-matching-model',
      'safety-monitoring-model',
      'outcome-analysis-model'
    ],
    correlations: {
      'initial_development': 0.5, // Moderate correlation with initial development
      'ai_inference': 0.8 // Strong correlation with inference costs
    }
  }
); 