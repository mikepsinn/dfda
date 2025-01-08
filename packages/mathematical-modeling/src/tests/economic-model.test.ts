import { Model } from '../model';
import { ModelParameter, OutcomeMetric, ConstantParameter, VariableParameter } from '../types';
import * as parameters from '../../examples/economic-model/parameters';

describe('Economic Model', () => {
  let model: Model;

  beforeEach(() => {
    model = new Model({
      id: 'test_model',
      title: 'Test Economic Model',
      description: 'Test model for economic analysis',
      version: '1.0.0',
      parameters: Object.values(parameters),
      metrics: []
    });
  });

  describe('Parameter Types', () => {
    test('correctly identifies constant parameters', () => {
      const constants = model.getConstantParameters();
      expect(constants).toHaveLength(2);
      expect(constants.map(p => p.id)).toContain('initial_development');
      expect(constants.map(p => p.id)).toContain('ai_training');
      expect(constants.every(p => p.type === 'constant')).toBe(true);
    });

    test('correctly identifies variable parameters', () => {
      const variables = model.getVariableParameters();
      expect(variables).toHaveLength(3);
      expect(variables.map(p => p.id)).toContain('annual_maintenance');
      expect(variables.map(p => p.id)).toContain('ai_inference');
      expect(variables.map(p => p.id)).toContain('regulatory_compliance');
      expect(variables.every(p => p.type === 'variable')).toBe(true);
    });
  });

  describe('Parameter Validation', () => {
    test('validates variable parameters within bounds', () => {
      const validValues = {
        annual_maintenance: 5_000_000,
        ai_inference: 0.01,
        regulatory_compliance: 200_000
      };
      expect(model.validateParameters(validValues)).toBe(true);
    });

    test('rejects values below minimum', () => {
      const invalidValues = {
        annual_maintenance: 500_000, // Below minValue
        ai_inference: 0.01,
        regulatory_compliance: 200_000
      };
      expect(model.validateParameters(invalidValues)).toBe(false);
    });

    test('rejects values above maximum', () => {
      const invalidValues = {
        annual_maintenance: 5_000_000,
        ai_inference: 0.2, // Above maxValue
        regulatory_compliance: 200_000
      };
      expect(model.validateParameters(invalidValues)).toBe(false);
    });

    test('accepts valid constant parameters', () => {
      const validValues = {
        initial_development: 50_000_000,
        ai_training: 10_000_000
      };
      expect(model.validateParameters(validValues)).toBe(true);
    });
  });

  describe('Parameter Metadata', () => {
    test('constant parameters have required statistical properties', () => {
      const constants = model.getConstantParameters();
      constants.forEach(param => {
        expect(param.confidenceInterval).toBeDefined();
        expect(param.standardError).toBeDefined();
        expect(param.distributionType).toBeDefined();
        expect(param.distributionParameters).toBeDefined();
      });
    });

    test('variable parameters have required stratification properties', () => {
      const variables = model.getVariableParameters();
      variables.forEach(param => {
        expect(param.timeHorizon).toBeDefined();
        expect(param.stratification).toBeDefined();
        expect(param.stratification?.dimensions.length).toBeGreaterThan(0);
        expect(Object.keys(param.stratification?.values || {})).toHaveLength(
          param.stratification?.dimensions.length || 0
        );
      });
    });
  });
});
