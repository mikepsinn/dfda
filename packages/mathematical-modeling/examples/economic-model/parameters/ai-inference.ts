import { TimeSeriesParameter } from '../../../src/models/parameters/TimeSeriesParameter';
import { formatCurrency } from '../../../src/format';

// Generate sample time series data with decreasing costs over time
const timePoints = Array.from({ length: 60 }, (_, i) => ({
  time: i,
  value: 1000000 * Math.pow(0.95, i), // 5% decrease each month
  uncertainty: {
    standardError: 50000 * Math.pow(0.95, i) // 5% of value
  }
}));

export const aiInference = new TimeSeriesParameter(
  'ai_inference',
  'AI Inference Cost',
  1000000,
  'USD/month',
  'Monthly cost of running AI inference in production, including cloud compute and API costs',
  'https://example.com',
  '🤖',
  timePoints,
  'Based on industry average cloud compute costs with standard ML model deployment',
  ['recurring', 'operational', 'ai'],
  {
    costCategory: 'variable',
    phase: 'operational',
    complexity: 'medium',
    riskLevel: 'low',
    scalingFactors: {
      'request_volume': 0.8, // 20% economies of scale
      'model_complexity': 1.2 // 20% premium for complex models
    }
  }
); 