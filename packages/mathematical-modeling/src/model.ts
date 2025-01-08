import {
  ModelConfig,
  ModelParameter,
  OutcomeMetric,
  SensitivityAnalysis,
  UncertaintyAnalysis,
  TimeSeriesResult,
  StratificationResult
} from './types';

export class Model {
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  private formatNumber(value: number, options: { 
    unit?: string;
    prefix?: string;
    decimals?: number;
    scale?: 'none' | 'thousands' | 'millions' | 'billions';
  } = {}): string {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return 'N/A';
    }

    const { unit = '', prefix = '', decimals = 2, scale = 'none' } = options;
    let scaledValue = value;
    let scaleSuffix = '';

    switch (scale) {
      case 'billions':
        scaledValue = value / 1_000_000_000;
        scaleSuffix = 'B';
        break;
      case 'millions':
        scaledValue = value / 1_000_000;
        scaleSuffix = 'M';
        break;
      case 'thousands':
        scaledValue = value / 1_000;
        scaleSuffix = 'K';
        break;
    }

    const formattedValue = scaledValue.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return `${prefix}${formattedValue}${scaleSuffix}${unit ? ` ${unit}` : ''}`;
  }

  private validateMetricValue(value: number, metric: OutcomeMetric): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  getMetric(id: string): OutcomeMetric | undefined {
    return this.config.metrics.find(m => m.id === id);
  }

  calculateMetric(id: string, values: Record<string, number>): number {
    const metric = this.getMetric(id);
    if (!metric) {
      throw new Error(`Metric ${id} not found`);
    }
    const result = metric.calculate(values);
    if (!this.validateMetricValue(result, metric)) {
      throw new Error(`Invalid calculation result for metric ${id}: ${result}`);
    }
    return result;
  }

  getParameter(id: string): ModelParameter | undefined {
    return this.config.parameters.find(p => p.id === id);
  }

  // Analysis methods
  calculateSensitivity(metricId: string, values: Record<string, number>): SensitivityAnalysis | undefined {
    const metric = this.getMetric(metricId);
    if (!metric || !metric.sensitivity) {
      return undefined;
    }
    return metric.sensitivity.calculate(values);
  }

  calculateUncertainty(metricId: string, values: Record<string, number>): UncertaintyAnalysis | undefined {
    const metric = this.getMetric(metricId);
    if (!metric || !metric.uncertainty) {
      return undefined;
    }
    return metric.uncertainty.calculate(values);
  }

  calculateTimeSeries(metricId: string, values: Record<string, number>): TimeSeriesResult | undefined {
    const metric = this.getMetric(metricId);
    if (!metric || !metric.timeSeries) {
      return undefined;
    }
    return metric.timeSeries.calculate(values);
  }

  calculateBySubgroup(metricId: string, values: Record<string, number>, strata: string[]): StratificationResult | undefined {
    const metric = this.getMetric(metricId);
    if (!metric || !metric.stratification) {
      return undefined;
    }
    return metric.stratification.calculate(values, strata);
  }

  generateReport(values: Record<string, number>): string | undefined {
    if (!this.config.generateMarkdownReport) {
      return undefined;
    }

    // Validate all values before generating report
    const validatedValues: Record<string, number> = {};
    for (const [id, value] of Object.entries(values)) {
      const metric = this.getMetric(id);
      if (metric && this.validateMetricValue(value, metric)) {
        validatedValues[id] = value;
      } else {
        console.warn(`Invalid value for metric ${id}: ${value}`);
      }
    }

    return this.config.generateMarkdownReport(validatedValues);
  }

  getModelInfo() {
    return {
      id: this.config.id,
      title: this.config.title,
      description: this.config.description,
      version: this.config.version,
      metadata: this.config.metadata,
      requirements: this.config.requirements
    };
  }
}
