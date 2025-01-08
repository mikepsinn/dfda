import { ModelParameter, OutcomeMetric } from '../../src/types';
import * as parameters from './parameters';
import * as outcomes from './outcomes';
import * as fs from 'fs';
import * as path from 'path';
import { EconomicModel } from './economicModel';

describe('Economic Model Parameters', () => {
  describe('Parameter Types', () => {
    test('stochastic parameters have required properties', () => {
      const stochasticParams = [parameters.initialDevelopment, parameters.aiTraining];
      stochasticParams.forEach(param => {
        expect(param.parameterType).toBe('stochastic');
        expect(param.distributionType).toBeDefined();
        expect(param.distributionParameters).toBeDefined();
      });
    });

    test('time series parameters have required properties', () => {
      const timeSeriesParams = [parameters.annualMaintenance];
      timeSeriesParams.forEach(param => {
        expect(param.parameterType).toBe('time_series');
        expect(param.timeUnit).toBeDefined();
        expect(param.timeHorizon).toBeDefined();
        expect(param.timeHorizon.start).toBeDefined();
        expect(param.timeHorizon.end).toBeDefined();
        expect(param.timeHorizon.step).toBeDefined();
      });
    });

    test('deterministic parameters have required properties', () => {
      const deterministicParams = [parameters.aiInference];
      deterministicParams.forEach(param => {
        expect(param.parameterType).toBe('deterministic');
        expect(param.validation).toBeDefined();
        expect(typeof param.validation).toBe('function');
        if (param.scalingFunction) {
          expect(typeof param.scalingFunction).toBe('function');
        }
      });
    });

    test('stratified parameters have required properties', () => {
      const stratifiedParams = [parameters.regulatoryCompliance];
      stratifiedParams.forEach(param => {
        expect(param.parameterType).toBe('stratified');
        expect(param.dimensions).toBeDefined();
        expect(param.stratification).toBeDefined();
        expect(param.values).toBeDefined();
        expect(Object.keys(param.values).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Parameter Validations', () => {
    test('ai inference cost scales with volume', () => {
      const baseValue = parameters.aiInference.defaultValue;
      const scaledValue = parameters.aiInference.scalingFunction!(baseValue);
      expect(scaledValue).toBeLessThan(baseValue); // Should have volume discount
    });

    test('regulatory compliance varies by region and phase', () => {
      const usPhase1 = parameters.regulatoryCompliance.values['us:phase_1:documentation:standard'];
      const euPhase1 = parameters.regulatoryCompliance.values['eu:phase_1:documentation:standard'];
      expect(usPhase1).toBeDefined();
      expect(euPhase1).toBeDefined();
      expect(usPhase1).not.toBe(euPhase1);
    });
  });
});

describe('Economic Model Outcomes', () => {
  const model = new EconomicModel();

  describe('Total Cost Calculations', () => {
    test('calculates base total cost', () => {
      const result = model.calculateMetric('total_cost');
      expect(result).toBeGreaterThan(0);
      // Platform costs + 5 years maintenance + trial costs
      const expectedMinimum = 50_000_000 + 10_000_000 + (5_000_000 * 5);
      expect(result).toBeGreaterThan(expectedMinimum);
    });

    test('performs sensitivity analysis', () => {
      const sensitivity = model.calculateSensitivity('total_cost');
      expect(sensitivity).toBeDefined();
      expect(sensitivity?.method).toBe('sobol');
      expect(Object.keys(sensitivity?.results || {}).length).toBeGreaterThan(0);
    });

    test('generates time series projection', () => {
      const timeSeries = model.calculateTimeSeries('total_cost');
      expect(timeSeries).toBeDefined();
      expect(timeSeries?.timePoints.length).toBe(60); // 5 years monthly
      expect(timeSeries?.values.length).toBe(60);
      // First month should include one-time costs
      expect(timeSeries?.values[0]).toBeGreaterThan(60_000_000);
    });
  });

  describe('Time Savings Calculations', () => {
    test('calculates base time savings', () => {
      const result = model.calculateMetric('time_savings');
      expect(result).toBeGreaterThanOrEqual(3); // Minimum safety period
      expect(result).toBeLessThanOrEqual(9); // Maximum timeline
    });

    test('respects minimum safety period', () => {
      model.setParameterValue('ai_inference', 1); // Very high AI spend
      model.setParameterValue('regulatory_compliance', 100_000); // Minimal compliance
      const result = model.calculateMetric('time_savings');
      expect(result).toBeGreaterThanOrEqual(3); // Can't go below safety minimum
    });

    test('shows phase progression in time series', () => {
      const timeSeries = model.calculateTimeSeries('time_savings');
      expect(timeSeries).toBeDefined();
      // Should show distinct phases
      expect(timeSeries?.values[0]).toBe(3); // Safety phase
      expect(timeSeries?.values[4]).toBe(6); // Efficacy phase
      expect(timeSeries?.values[11]).toBe(9); // Complete
    });
  });
});

describe('Economic Model Documentation', () => {
  const model = new EconomicModel();

  test('generates markdown report', () => {
    const report = model.generateMarkdownReport();
    
    // Basic validation
    expect(report).toContain('# Economic Impact Model');
    expect(report).toContain('## Parameters');
    expect(report).toContain('## Results');
    expect(report).toContain('## Assumptions');
    expect(report).toContain('## Limitations');

    // Save report
    const reportPath = path.join(__dirname, 'economic-model-report.md');
    fs.writeFileSync(reportPath, report);
  });
});
