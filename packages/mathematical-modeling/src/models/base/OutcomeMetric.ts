import { InputParameter } from './InputParameter';
import { AbstractModelElement, ElementMetadata } from './AbstractModelElement';

export type MetricJSON = Omit<ReturnType<AbstractModelElement['toJSON']>, 'metadata'> & {
  value?: number;
  metadata?: ElementMetadata;
};

export abstract class OutcomeMetric extends AbstractModelElement {
  constructor(
    id: string,
    displayName: string,
    description: string,
    unitName: string,
    emoji: string,
    protected parameters: InputParameter[],
    metadata?: ElementMetadata
  ) {
    super(id, displayName, description, unitName, emoji, metadata);
  }

  abstract calculate(): number;

  getParameterValue(parameterId: string): number {
    const param = this.parameters.find(p => p.id === parameterId);
    if (!param) {
      throw new Error(`Parameter ${parameterId} not found`);
    }
    return param.value;
  }

  generateDisplayValue(): string {
    const value = this.calculate();
    return `${value}${this.unitName ? ` ${this.unitName}` : ''}`;
  }

  generateCalculationExplanation(): string {
    return `Calculation for ${this.displayName}:\n${this.description}`;
  }

  generateReport(): string {
    const value = this.calculate();
    const sections: string[] = [
      `# ${this.displayName} ${this.emoji}`,
      this.description
    ];

    if (this.parameters.length > 0) {
      sections.push(
        '\n## Parameters Used',
        ...this.parameters.map(p =>
          `- ${p.displayName}: ${p.generateDisplayValue()}`
        )
      );
    }

    sections.push(
      '\n## Calculation Method',
      this.generateCalculationExplanation(),
      '\n## Result',
      `${value} ${this.unitName}`
    );

    if (this.metadata?.assumptions?.length) {
      sections.push(
        '\n## Assumptions',
        ...this.metadata.assumptions.map(a => `- ${a}`)
      );
    }

    return sections.join('\n');
  }

  toJSON(): MetricJSON {
    return {
      ...super.toJSON() as Omit<MetricJSON, 'value'>,
      value: this.calculate()
    };
  }
} 