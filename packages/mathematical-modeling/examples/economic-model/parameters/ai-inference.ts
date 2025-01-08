import { DeterministicParameter } from '../../../src/types';

export const aiInference: DeterministicParameter = {
  id: 'ai_inference',
  parameterType: 'deterministic',
  displayName: 'AI Inference Cost',
  defaultValue: 0.01,
  unitName: 'USD/interaction',
  description: 'Cost per patient interaction for AI inference including matching and analysis',
  sourceUrl: 'https://example.com',
  emoji: '🤖',
  tags: ['ai', 'operational', 'per-interaction'],
  metadata: {
    costCategory: 'variable',
    scalability: 'sublinear',
    components: ['model-inference', 'data-processing']
  },

  // Validation and bounds
  minValue: 0.001,
  maxValue: 0.05,
  suggestedRange: [0.005, 0.02],
  validation: (value: number) => value > 0,

  // Scaling function for volume discounts
  scalingFunction: (value: number) => {
    // Example: Cost reduces with volume
    // Using log scale for continuous scaling
    return Math.max(
      value * Math.pow(0.95, Math.log10(Math.max(value * 100000, 1))),
      value * 0.6 // Maximum 40% discount
    );
  },

  // Dependencies
  dependentParameters: [
    'annual_maintenance', // Inference costs affect maintenance
    'ai_training'        // Training quality affects inference costs
  ]
}; 