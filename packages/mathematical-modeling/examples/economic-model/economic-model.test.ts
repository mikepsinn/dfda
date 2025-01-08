import { Model } from '../../src/model';
import { ModelParameter, OutcomeMetric, ModelConfig } from '../../src/types';
import * as parameters from './parameters';
import * as outcomes from './outcomes';
import * as fs from 'fs';
import * as path from 'path';

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
  const model = new Model({
    id: 'economic_model',
    title: 'Economic Model',
    description: 'Test economic model',
    version: '1.0.0',
    parameters: Object.values(parameters),
    metrics: Object.values(outcomes)
  });

  const defaultParams = {
    initial_development: 50_000_000,
    ai_training: 10_000_000,
    annual_maintenance: 5_000_000,
    ai_inference: 0.01,
    regulatory_compliance: 200_000,
    patient_costs: 2.65
  };

  describe('Total Cost Calculations', () => {
    test('calculates base total cost', () => {
      const result = model.calculateMetric('total_cost', defaultParams);
      expect(result).toBeGreaterThan(0);
      // Platform costs + 5 years maintenance + trial costs
      const expectedMinimum = 50_000_000 + 10_000_000 + (5_000_000 * 5);
      expect(result).toBeGreaterThan(expectedMinimum);
    });

    test('performs sensitivity analysis', () => {
      const metric = model.getMetric('total_cost');
      const sensitivity = metric?.sensitivity?.calculate(defaultParams);
      expect(sensitivity).toBeDefined();
      expect(sensitivity?.method).toBe('sobol');
      expect(Object.keys(sensitivity?.results || {}).length).toBeGreaterThan(0);
    });

    test('generates time series projection', () => {
      const metric = model.getMetric('total_cost');
      const timeSeries = metric?.timeSeries?.calculate(defaultParams);
      expect(timeSeries).toBeDefined();
      expect(timeSeries?.timePoints.length).toBe(60); // 5 years monthly
      expect(timeSeries?.values.length).toBe(60);
      // First month should include one-time costs
      expect(timeSeries?.values[0]).toBeGreaterThan(60_000_000);
    });
  });

  describe('Time Savings Calculations', () => {
    test('calculates base time savings', () => {
      const result = model.calculateMetric('time_savings', defaultParams);
      expect(result).toBeGreaterThanOrEqual(3); // Minimum safety period
      expect(result).toBeLessThanOrEqual(9); // Maximum timeline
    });

    test('respects minimum safety period', () => {
      const fastParams = {
        ...defaultParams,
        ai_inference: 1, // Very high AI spend
        regulatory_compliance: 100_000 // Minimal compliance
      };
      const result = model.calculateMetric('time_savings', fastParams);
      expect(result).toBeGreaterThanOrEqual(3); // Can't go below safety minimum
    });

    test('shows phase progression in time series', () => {
      const metric = model.getMetric('time_savings');
      const timeSeries = metric?.timeSeries?.calculate(defaultParams);
      expect(timeSeries).toBeDefined();
      // Should show distinct phases
      expect(timeSeries?.values[0]).toBe(3); // Safety phase
      expect(timeSeries?.values[4]).toBe(6); // Efficacy phase
      expect(timeSeries?.values[11]).toBe(9); // Complete
    });
  });
});

describe('Economic Model Documentation', () => {
  const defaultParams = {
    initial_development: 50_000_000,
    ai_training: 10_000_000,
    annual_maintenance: 5_000_000,
    ai_inference: 0.01,
    regulatory_compliance: 200_000,
    patient_costs: 2.65
  };

  const modelConfig: ModelConfig = {
    id: 'economic_model',
    title: 'Economic Model',
    description: 'Test economic model',
    version: '1.0.0',
    parameters: Object.values(parameters),
    metrics: Object.values(outcomes),
    metadata: {
      authors: ['Test Author'],
      lastUpdated: new Date().toISOString(),
      references: [{
        citation: 'Example citation',
        doi: '10.1234/example',
        url: 'https://example.com'
      }],
      assumptions: [
        'Assumes linear scaling of costs',
        'Assumes constant regulatory environment'
      ],
      limitations: [
        'Does not account for market competition',
        'Limited to US market dynamics'
      ]
    },
    generateMarkdownReport: (results: Record<string, number>): string => {
      const report = [
        `# ${modelConfig.title} v${modelConfig.version}`,
        '',
        `## Overview`,
        modelConfig.description,
        '',
        `## Parameters`,
        ...modelConfig.parameters.map((p: ModelParameter) => [
          `### ${p.displayName} (${p.emoji})`,
          p.description,
          `- Default: ${p.defaultValue} ${p.unitName}`,
          `- Source: ${p.sourceUrl}`,
          p.sourceQuote ? `- Quote: "${p.sourceQuote}"` : '',
          ''
        ].filter(Boolean).join('\n')),
        '',
        `## Outcomes`,
        ...modelConfig.metrics.map((m: OutcomeMetric) => [
          `### ${m.displayName} (${m.emoji})`,
          m.description,
          `- Value: ${results[m.id]} ${m.unitName}`,
          `- Explanation: ${m.generateCalculationExplanation(results)}`,
          ''
        ].join('\n')),
        '',
        `## Assumptions`,
        ...(modelConfig.metadata?.assumptions?.map(a => `- ${a}`) ?? []),
        '',
        `## Limitations`,
        ...(modelConfig.metadata?.limitations?.map(l => `- ${l}`) ?? []),
        '',
        `## References`,
        ...(modelConfig.metadata?.references?.map(r => 
          `- ${r.citation}${r.doi ? ` (DOI: ${r.doi})` : ''}${r.url ? ` [Link](${r.url})` : ''}`
        ) ?? []),
        '',
        `Generated on: ${new Date().toISOString()}`
      ].join('\n');

      return report;
    }
  };

  const model = new Model(modelConfig);

  test('generates markdown report', () => {
    const results = {
      total_cost: model.calculateMetric('total_cost', defaultParams),
      time_savings: model.calculateMetric('time_savings', defaultParams)
    };

    // Pass the full parameters for calculation explanations
    const report = modelConfig.generateMarkdownReport!({
      ...defaultParams,
      ...results
    });
    
    // Basic validation
    expect(report).toContain('# Economic Model');
    expect(report).toContain('## Parameters');
    expect(report).toContain('## Outcomes');
    expect(report).toContain('## Assumptions');
    expect(report).toContain('## Limitations');
    expect(report).toContain('## References');

    // Save report
    const reportPath = path.join(__dirname, 'economic-model-report.md');
    fs.writeFileSync(reportPath, report);
    
    // Verify file was written
    expect(fs.existsSync(reportPath)).toBe(true);
    const content = fs.readFileSync(reportPath, 'utf8');
    expect(content).toBe(report);
  });
});
