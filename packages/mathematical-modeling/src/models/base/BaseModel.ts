import { BaseParameter } from './BaseParameter';
import { OutcomeMetric } from './OutcomeMetric';

export type ModelMetadata = {
  authors?: string[];
  lastUpdated?: string;
  assumptions?: string[];
  notes?: string[];
};

export class BaseModel {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly description: string,
    readonly version: string,
    readonly parameters: BaseParameter[],
    readonly metrics: OutcomeMetric[],
    readonly metadata?: ModelMetadata
  ) {}

  getMetric(id: string): OutcomeMetric | undefined {
    return this.metrics.find(m => m.id === id);
  }

  getParameter(id: string): BaseParameter | undefined {
    return this.parameters.find(p => p.id === id);
  }

  setParameterValue(id: string, value: number): void {
    const param = this.getParameter(id);
    if (!param) {
      throw new Error(`Parameter ${id} not found`);
    }
    param.setValue(value);
  }

  calculateMetric(id: string): number {
    const metric = this.getMetric(id);
    if (!metric) {
      throw new Error(`Metric ${id} not found`);
    }
    return metric.calculate();
  }

  generateReport(): string {
    const sections = [
      `# ${this.title} v${this.version}`,
      this.description,
      '\n## Parameters',
      ...this.parameters.map(p => 
        `### ${p.displayName} ${p.emoji}\n` +
        `- Current Value: ${p.generateDisplayValue()}\n` +
        `- Description: ${p.description}`
      ),
      '\n## Results',
      ...this.metrics.map(m => {
        const value = m.calculate();
        return `### ${m.displayName} ${m.emoji}\n` +
          `- Value: ${value} ${m.unitName}\n` +
          `- Description: ${m.description}`;
      })
    ];

    if (this.metadata?.assumptions?.length) {
      sections.push(
        '\n## Model Assumptions',
        ...this.metadata.assumptions.map(a => `- ${a}`)
      );
    }

    return sections.join('\n');
  }
} 