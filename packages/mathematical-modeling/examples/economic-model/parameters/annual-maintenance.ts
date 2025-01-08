import { TimeSeriesParameter } from '../../../src/types';
import { formatCurrency } from '../../../src/format';

export const annualMaintenance: TimeSeriesParameter = {
  id: 'annual_maintenance',
  parameterType: 'time_series',
  displayName: 'Annual Maintenance Cost',
  defaultValue: 5_000_000,
  unitName: 'USD/year',
  description: 'Annual platform maintenance including cloud infrastructure, security updates, and operational costs',
  sourceUrl: 'https://example.com',
  emoji: '🔧',
  generateDisplayValue: (value: number) => formatCurrency(value) + '/year',
  tags: ['recurring', 'maintenance', 'operations'],
  metadata: {
    costCategory: 'recurring',
    scalability: 'sublinear',
    components: ['infrastructure', 'security', 'operations']
  },

  // Time series properties
  timeUnit: 'months',
  timeHorizon: {
    start: 0,
    end: 60, // 5 year projection
    step: 1  // Monthly granularity
  },
  
  // Growth and seasonality
  seasonality: true, // Costs might vary by season
  trend: 'exponential', // Assuming some economies of scale
  interpolation: 'cubic', // Smooth transitions between points
}; 