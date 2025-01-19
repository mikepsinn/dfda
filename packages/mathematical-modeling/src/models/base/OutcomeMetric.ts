import { BaseParameter } from './BaseParameter';

export type MetricMetadata = {
  category?: string;
  assumptions?: string[];
  notes?: string[];
};

export abstract class OutcomeMetric {
  constructor(
    readonly id: string,
    readonly displayName: string,
    readonly description: string,
    readonly unitName: string,
    readonly emoji: string,
    protected parameters: BaseParameter[],
    readonly metadata?: MetricMetadata
  ) {}

  abstract calculate(): number;

  getParameterValue(parameterId: string): number {
    const param = this.parameters.find(p => p.id === parameterId);
    if (!param) {
      throw new Error(`Parameter ${parameterId} not found`);
    }
    return param.value;
  }

  generateCalculationExplanation(): string {
    return `Calculation for ${this.displayName}:\n${this.description}`;
  }

  generateReport(): string {
    const value = this.calculate();
    const sections = [
      `# ${this.displayName} ${this.emoji}`,
      this.description,
      '\n## Parameters Used',
      ...this.parameters.map(p => 
        `- ${p.displayName}: ${p.generateDisplayValue()}`
      ),
      '\n## Calculation Method',
      this.generateCalculationExplanation(),
      '\n## Result',
      `${value} ${this.unitName}`
    ];

    if (this.metadata?.assumptions?.length) {
      sections.push(
        '\n## Assumptions',
        ...this.metadata.assumptions.map(a => `- ${a}`)
      );
    }

    return sections.join('\n');
  }
} 