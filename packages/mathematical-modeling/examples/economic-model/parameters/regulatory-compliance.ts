import { StratifiedParameter } from '../../../src/models/parameters/StratifiedParameter';
import { formatCurrency } from '../../../src/format';

const complianceStrata = [
  {
    id: 'fda_clearance',
    name: 'FDA Clearance',
    value: 2000000,
    weight: 1,
    sampleSize: 100,
    standardError: 200000
  },
  {
    id: 'hipaa_compliance',
    name: 'HIPAA Compliance',
    value: 500000,
    weight: 1,
    sampleSize: 150,
    standardError: 50000
  },
  {
    id: 'gdpr_compliance',
    name: 'GDPR Compliance',
    value: 300000,
    weight: 0.5, // Less weight for non-US market
    sampleSize: 80,
    standardError: 30000
  },
  {
    id: 'quality_system',
    name: 'Quality System',
    value: 1000000,
    weight: 1,
    sampleSize: 120,
    standardError: 100000
  },
  {
    id: 'security_audits',
    name: 'Security Audits',
    value: 250000,
    weight: 1,
    sampleSize: 200,
    standardError: 25000
  }
];

export const regulatoryCompliance = new StratifiedParameter(
  'regulatory_compliance',
  'Regulatory Compliance Cost',
  4050000, // Sum of all compliance costs
  'USD',
  'Annual costs for maintaining regulatory compliance across different requirements',
  'https://example.com',
  '📋',
  complianceStrata,
  'Based on industry standards and regulatory requirements for medical devices',
  ['recurring', 'compliance', 'regulatory'],
  {
    costCategory: 'fixed',
    phase: 'operational',
    complexity: 'high',
    riskLevel: 'high',
    updateFrequency: 'annual',
    geographicScope: ['US', 'EU'],
    regulatoryFrameworks: ['FDA', 'HIPAA', 'GDPR', 'ISO 13485']
  }
); 