import { DeterministicParameter } from '../../../src/models/parameters/DeterministicParameter';
import { formatCurrency } from '../../../src/format';

export const annualMaintenance = new DeterministicParameter(
  'annual_maintenance',
  'Annual Maintenance Cost',
  5_000_000,
  'USD/year',
  'Annual cost for platform maintenance, updates, security, and support',
  'https://example.com/maintenance',
  '🔧',
  1_000_000, // Minimum maintenance cost
  10_000_000, // Maximum maintenance cost
  [4_000_000, 6_000_000], // Suggested range
  (baseValue: number) => {
    // Scale maintenance cost with platform size
    // Assume platform size is measured by number of trials
    const trialsPerYear = 1000; // From model description
    const scaleFactor = Math.log10(trialsPerYear) * 0.2; // 20% increase per 10x trials
    return baseValue * (1 + scaleFactor);
  },
  ['initial_development', 'ai_training'], // Dependencies
  'Based on industry standards for large-scale medical platforms',
  ['recurring', 'maintenance', 'operations'],
  {
    costCategory: 'fixed',
    phase: 'operational',
    complexity: 'medium',
    riskLevel: 'low',
    components: [
      'infrastructure-maintenance',
      'security-updates',
      'user-support',
      'compliance-monitoring'
    ],
    updateFrequency: 'monthly',
    staffingRequirements: {
      engineers: 20,
      supportStaff: 10,
      complianceOfficers: 5
    }
  }
); 