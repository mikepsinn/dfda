import { BaseModel } from '../../src/models/base/BaseModel';
import { ModelMetadata } from '../../src/models/metadata/ModelMetadata';
import { totalCost } from './outcomes/total-cost';
import { timeSavings } from './outcomes/time-savings';
import { initialDevelopment } from './parameters/initial-development';
import { aiTraining } from './parameters/ai-training';
import { aiInference } from './parameters/ai-inference';
import { annualMaintenance } from './parameters/annual-maintenance';
import { perPatientCosts } from './parameters/per-patient-costs';
import { regulatoryCompliance } from './parameters/regulatory-compliance';
import { safetyMonitoring } from './parameters/safety-monitoring';

describe('Economic Model', () => {
  const parameters = [
    initialDevelopment,
    aiTraining,
    aiInference,
    annualMaintenance,
    perPatientCosts,
    regulatoryCompliance,
    safetyMonitoring
  ];

  const metadata = new ModelMetadata(
    ['John Doe', 'Jane Smith'],
    '2024-01-15',
    [
      {
        citation: 'Smith et al. (2023) Cost Analysis of AI in Healthcare',
        doi: '10.1234/example',
        url: 'https://example.com/paper'
      }
    ],
    [
      'Linear cost scaling with patient volume',
      'Constant maintenance costs over time'
    ],
    [
      'Does not account for regional cost variations',
      'Limited long-term data availability'
    ],
    {
      status: 'draft',
      validationMethod: 'peer-review'
    }
  );

  const model = new BaseModel(
    'economic-model',
    'Healthcare AI Economic Model',
    'A model for analyzing the economic impact of AI in healthcare',
    '1.0.0',
    parameters,
    [totalCost, timeSavings],
    metadata
  );

  test('model initialization', () => {
    expect(model.id).toBe('economic-model');
    expect(model.title).toBe('Healthcare AI Economic Model');
    expect(model.version).toBe('1.0.0');
    expect(model.parameters.length).toBe(7);
    expect(model.metrics.length).toBe(2);
  });

  test('parameter access', () => {
    const param = model.getParameter('initial-development');
    expect(param).toBeDefined();
    expect(param?.id).toBe('initial-development');
    expect(param?.displayName).toBe('Initial Development Cost');
  });

  test('metric calculation', () => {
    const totalCostMetric = model.getMetric('total-cost');
    expect(totalCostMetric).toBeDefined();
    expect(totalCostMetric?.calculate()).toBeGreaterThan(0);

    const timeSavingsMetric = model.getMetric('time-savings');
    expect(timeSavingsMetric).toBeDefined();
    expect(timeSavingsMetric?.calculate()).toBeGreaterThan(0);
  });

  test('report generation', () => {
    const report = model.generateMarkdownReport();
    expect(report).toContain('Healthcare AI Economic Model');
    expect(report).toContain('Initial Development Cost');
    expect(report).toContain('AI Training Cost');
    expect(report).toContain('Model Metrics');
    expect(report).toContain('Authors');
    expect(report).toContain('Assumptions');
    expect(report).toContain('Limitations');
    expect(report).toContain('References');
  });

  test('metadata methods', () => {
    expect(metadata.isValidated()).toBe(false);
    expect(metadata.isPeerReviewed()).toBe(false);
    expect(metadata.getLastUpdatedDate()).toEqual(new Date('2024-01-15'));
    expect(metadata.getCitations()).toContain('Smith et al. (2023) Cost Analysis of AI in Healthcare');
    expect(metadata.getDOIs()).toContain('10.1234/example');
    expect(metadata.getURLs()).toContain('https://example.com/paper');
    expect(metadata.hasAssumption('Linear cost scaling with patient volume')).toBe(true);
    expect(metadata.hasLimitation('Does not account for regional cost variations')).toBe(true);
  });
});
