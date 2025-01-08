import { BaseModel, ModelParameter, OutcomeMetric } from '../../src/types';
import * as parameters from './parameters';
import * as outcomes from './outcomes';


export class EconomicModel extends BaseModel {
  constructor() {
    super({
      id: 'economic_model',
      title: 'Economic Impact Model',
      description: 'Model for calculating economic impacts of healthcare interventions',
      version: '1.0.0',
      parameters: Object.values(parameters) as ModelParameter[],
      metrics: Object.values(outcomes) as OutcomeMetric[],
      metadata: {
        authors: ['Example Author'],
        lastUpdated: new Date().toISOString(),
        assumptions: [
          'Assumes linear scaling of costs',
          'Assumes constant regulatory environment'
        ],
        limitations: [
          'Does not account for market competition',
          'Limited to US market dynamics'
        ]
      }
    });
  }

  // Economic model specific utility functions
  getVolumeDiscount(volume: number): number {
    // Logarithmic scaling: each 10x increase in volume gives additional 10% discount
    // Max discount of 50%
    const discount = Math.min(0.5, Math.log10(volume) * 0.1);
    return 1 - discount;
  }

  getAutomationEfficiency(aiSpend: number): number {
    // More AI spend = better efficiency
    // Returns a number between 0.5 (50% cost reduction) and 1 (no reduction)
    return Math.max(0.5, 1 - Math.log10(aiSpend) * 0.05);
  }
}
