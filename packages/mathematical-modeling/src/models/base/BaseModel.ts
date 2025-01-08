import { BaseParameter } from './BaseParameter';
import { OutcomeMetric } from './OutcomeMetric';
import { SensitivityAnalysis } from '../analysis/SensitivityAnalysis';
import { TimeSeriesResult } from '../types/results';
import { ModelMetadata } from '../metadata/ModelMetadata';

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
    const sections: string[] = [];

    // Title and Description
    sections.push(`# ${this.title}\n`);
    sections.push(`${this.description}\n`);
    sections.push(`Version: ${this.version}\n`);

    // Parameters Section
    sections.push('## Model Parameters\n');
    
    // Group parameters by type
    const fixedParams = this.parameters.filter(p => p.metadata?.costCategory === 'fixed');
    const variableParams = this.parameters.filter(p => p.metadata?.costCategory === 'variable');
    
    if (fixedParams.length > 0) {
      sections.push('### Fixed Costs\n');
      fixedParams.forEach(param => {
        sections.push(`#### ${param.displayName}\n`);
        sections.push(`- Default Value: ${param.generateDisplayValue(param.defaultValue)}`);
        sections.push(`- Description: ${param.description}`);
        if (param.metadata) {
          sections.push('- Additional Information:');
          Object.entries(param.metadata).forEach(([key, value]) => {
            sections.push(`  - ${key}: ${JSON.stringify(value)}`);
          });
        }
        sections.push('');
      });
    }

    if (variableParams.length > 0) {
      sections.push('### Variable Costs\n');
      variableParams.forEach(param => {
        sections.push(`#### ${param.displayName}\n`);
        sections.push(`- Base Value: ${param.generateDisplayValue(param.defaultValue)}`);
        sections.push(`- Description: ${param.description}`);
        if (param.metadata) {
          sections.push('- Additional Information:');
          Object.entries(param.metadata).forEach(([key, value]) => {
            sections.push(`  - ${key}: ${JSON.stringify(value)}`);
          });
        }
        sections.push('');
      });
    }

    // Metrics Section
    if (this.metrics.length > 0) {
      sections.push('## Model Metrics\n');
      this.metrics.forEach(metric => {
        sections.push(`### ${metric.title}\n`);
        sections.push(`${metric.description}\n`);
        sections.push('#### Calculation Method\n');
        sections.push(metric.generateCalculationExplanation());
        sections.push('');
      });
    }

    // Metadata Section
    if (this.metadata) {
      sections.push('## Additional Information\n');

      if (this.metadata.authors?.length) {
        sections.push('### Authors\n');
        sections.push(this.metadata.authors.join(', ') + '\n');
      }

      if (this.metadata.lastUpdated) {
        sections.push('### Last Updated\n');
        sections.push(new Date(this.metadata.lastUpdated).toLocaleDateString() + '\n');
      }

      if (this.metadata.assumptions?.length) {
        sections.push('### Assumptions\n');
        this.metadata.assumptions.forEach(assumption => {
          sections.push(`- ${assumption}`);
        });
        sections.push('');
      }

      if (this.metadata.limitations?.length) {
        sections.push('### Limitations\n');
        this.metadata.limitations.forEach(limitation => {
          sections.push(`- ${limitation}`);
        });
        sections.push('');
      }

      if (this.metadata.references?.length) {
        sections.push('### References\n');
        this.metadata.references.forEach(ref => {
          sections.push(`- ${ref.citation}`);
          if (ref.doi) sections.push(`  DOI: ${ref.doi}`);
          if (ref.url) sections.push(`  URL: ${ref.url}`);
        });
        sections.push('');
      }
    }

    return sections.join('\n');
  }
} 