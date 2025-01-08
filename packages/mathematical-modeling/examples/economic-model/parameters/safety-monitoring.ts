import { StratifiedParameter } from '../../../src/models/parameters/StratifiedParameter';
import { formatCurrency } from '../../../src/format';

const safetyStrata = [
  {
    id: 'ai_monitoring',
    name: 'AI Safety Monitoring',
    value: 100, // $0.10 per patient * 1000 patients
    weight: 1,
    sampleSize: 1000,
    standardError: 10
  },
  {
    id: 'human_oversight',
    name: 'Human Safety Oversight',
    value: 10000,
    weight: 1,
    sampleSize: 50, // Number of oversight sessions
    standardError: 1000
  },
  {
    id: 'incident_investigation',
    name: 'Safety Incident Investigation',
    value: 5000, // Additional budget for potential investigations
    weight: 0.2, // Lower weight as not always needed
    sampleSize: 10,
    standardError: 1000
  },
  {
    id: 'safety_reporting',
    name: 'Safety Report Generation',
    value: 2000,
    weight: 1,
    sampleSize: 12, // Monthly reports
    standardError: 200
  }
];

export const safetyMonitoring = new StratifiedParameter(
  'safety_monitoring',
  'Safety Monitoring Cost',
  17100, // Base total from model description
  'USD/trial',
  'Cost of safety monitoring including AI analysis and human oversight',
  'https://example.com/safety',
  '🛡️',
  safetyStrata,
  'Based on automated safety monitoring systems with human oversight',
  ['variable', 'safety', 'monitoring', 'per-trial'],
  {
    costCategory: 'variable',
    phase: 'operational',
    complexity: 'high',
    riskLevel: 'high',
    monitoringFrequency: 'continuous',
    automationLevel: 'high',
    humanOversight: 'required',
    escalationProtocol: 'defined',
    regulatoryAlignment: ['FDA', 'EMA', 'PMDA']
  }
); 