import { BaseParameter } from './BaseParameter';
import { OutcomeMetric } from './OutcomeMetric';
import { SensitivityAnalysis } from '../analysis/SensitivityAnalysis';
import { TimeSeriesResult } from '../types/results';

export interface ModelMetadata {
  authors?: string[];
  lastUpdated?: string;
  references?: Array<{
    citation: string;
    doi?: string;
    url?: string;
  }>;
  assumptions?: string[];
  limitations?: string[];
  validationStatus?: {
    status: 'draft' | 'peer-reviewed' | 'validated';
    validatedBy?: string[];
    validationDate?: string;
    validationMethod?: string;
  };
}

export class BaseModel {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly version: string;
  readonly parameters: BaseParameter[];
  readonly metrics: OutcomeMetric[];
  readonly metadata?: ModelMetadata;

  constructor(config: {
    id: string;
    title: string;
    description: string;
    version: string;
    parameters: BaseParameter[];
    metrics: OutcomeMetric[];
    metadata?: ModelMetadata;
  }) {
    this.id = config.id;
    this.title = config.title;
    this.description = config.description;
    this.version = config.version;
    this.parameters = config.parameters;
    this.metrics = config.metrics;
    this.metadata = config.metadata;
  }

  getMetric(id: string): OutcomeMetric | undefined {
    return this.metrics.find(m => m.id === id);
  }

  getParameter(id: string): BaseParameter | undefined {
    return this.parameters.find(p => p.id === id);
  }

  getParameterValue(id: string): number {
    const param = this.getParameter(id);
    if (!param) {
      throw new Error(`Parameter ${id} not found`);
    }
    return param.defaultValue;
  }

  getParameterDisplayValue(id: string): string {
    const param = this.getParameter(id);
    if (!param) {
      throw new Error(`Parameter ${id} not found`);
    }
    return param.generateDisplayValue(param.defaultValue);
  }

  setParameterValue(id: string, value: number): void {
    const param = this.getParameter(id);
    if (!param) {
      throw new Error(`Parameter ${id} not found`);
    }
    if (!param.validate(value)) {
      throw new Error(`Invalid value ${value} for parameter ${id}`);
    }
    // Note: This is a bit hacky, we might want to handle this differently
    (param as any).defaultValue = value;
  }

  calculateMetric(id: string): number {
    const metric = this.getMetric(id);
    if (!metric) {
      throw new Error(`Metric ${id} not found`);
    }
    return metric.calculate();
  }

  calculateSensitivity(metricId: string): SensitivityAnalysis | undefined {
    const metric = this.getMetric(metricId);
    if (!metric) {
      throw new Error(`Metric ${metricId} not found`);
    }
    // TODO: Implement sensitivity analysis
    return undefined;
  }

  calculateTimeSeries(metricId: string): TimeSeriesResult | undefined {
    const metric = this.getMetric(metricId);
    if (!metric) {
      throw new Error(`Metric ${metricId} not found`);
    }
    // TODO: Implement time series calculation
    return undefined;
  }

  generateMarkdownReport(): string {
    const report = [
      `# ${this.title}`,
      '',
      `## Description`,
      this.description,
      '',
      `## Version`,
      this.version,
      '',
      `## Parameters`,
      ...this.parameters.map((p: BaseParameter) => [
        `### ${p.displayName}`,
        `- Description: ${p.description}`,
        `- Default Value: ${p.generateDisplayValue(p.defaultValue)}`,
        `- Source: ${p.sourceUrl}`,
        p.sourceQuote ? `- Quote: "${p.sourceQuote}"` : '',
        ''
      ].filter(Boolean).join('\n')),
      '',
      `## Metrics`,
      ...this.metrics.map((m: OutcomeMetric) => [
        `### ${m.displayName}`,
        `- Description: ${m.description}`,
        `- Unit: ${m.unitName}`,
        `- Value: ${m.generateDisplayValue(this.calculateMetric(m.id))}`,
        `- Calculation: ${m.generateCalculationExplanation()}`,
        ''
      ].join('\n')),
      '',
      `## Metadata`,
      ...(this.metadata?.authors ? [`### Authors`, ...this.metadata.authors.map((a: string) => `- ${a}`), ''] : []),
      ...(this.metadata?.assumptions ? [`### Assumptions`, ...this.metadata.assumptions.map((a: string) => `- ${a}`), ''] : []),
      ...(this.metadata?.limitations ? [`### Limitations`, ...this.metadata.limitations.map((l: string) => `- ${l}`), ''] : []),
      '',
      `Generated on: ${new Date().toISOString()}`
    ].join('\n');

    return report;
  }
} 