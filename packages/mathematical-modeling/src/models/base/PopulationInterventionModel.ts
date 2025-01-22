import { InputParameter } from './InputParameter';
import { OutcomeMetric } from './OutcomeMetric';

export type InterventionType = 
  | 'health'
  | 'environmental'
  | 'educational'
  | 'social'
  | 'infrastructure'
  | 'economic'
  | 'other';

export type ModelMetadata = {
  interventionType: InterventionType;
  populationDescription: string;
  timeHorizon: string;
  geographicScope: string;
  implementationPhases?: string[];
  stakeholders?: string[];
  subgroups?: string[];
  assumptions?: string[];
  limitations?: string[];
  references?: string[];
};

export class PopulationInterventionModel {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public version: string,
    public parameters: InputParameter[],
    public metrics: OutcomeMetric[],
    public metadata: ModelMetadata
  ) {
    this.validateMetadata();
  }

  private validateMetadata() {
    const requiredFields: (keyof ModelMetadata)[] = [
      'interventionType',
      'populationDescription', 
      'timeHorizon',
      'geographicScope'
    ];

    for (const field of requiredFields) {
      if (!this.metadata[field]) {
        throw new Error(`Missing required metadata field: ${field}`);
      }
    }
  }

  getMetric(id: string): OutcomeMetric {
    const metric = this.metrics.find(m => m.id === id);
    if (!metric) {
      throw new Error(`Metric ${id} not found`);
    }
    return metric;
  }

  getParameter(id: string): InputParameter {
    const param = this.parameters.find(p => p.id === id);
    if (!param) {
      throw new Error(`Parameter ${id} not found`);
    }
    return param;
  }

  setParameterValue(id: string, value: number) {
    const param = this.getParameter(id);
    param.value = value;
  }

  calculateMetrics(): Record<string, number> {
    return Object.fromEntries(
      this.metrics.map(metric => [metric.id, metric.calculate()])
    );
  }

  /**
   * Generates a structured markdown report with model configuration and results
   * @example
   * const report = model.generateReport();
   * fs.writeFileSync('model-report.md', report);
   */
  generateReport(): string {
    const sections: string[] = [];
    
    // Header section
    sections.push(
      `# ${this.title} v${this.version}`,
      this.description
    );

    // Metadata section
    sections.push(
      '\n## Model Metadata',
      `- **Intervention Type**: ${this.metadata.interventionType}`,
      `- **Population**: ${this.metadata.populationDescription}`,
      `- **Time Horizon**: ${this.metadata.timeHorizon}`,
      `- **Geographic Scope**: ${this.metadata.geographicScope}`
    );

    // Parameters section
    sections.push('\n## Parameters');
    sections.push(...this.parameters.map(p =>
      `### ${p.displayName} ${p.emoji}\n` +
      `${p.description}\n` +
      `**Current Value**: ${p.generateDisplayValue()}`
    ));

    // Metrics section
    sections.push('\n## Metrics');
    sections.push(...this.metrics.map(m => m.generateReport()));

    if (this.metadata.assumptions?.length) {
      sections.push(
        '\n## Model Assumptions',
        ...this.metadata.assumptions.map(a => `- ${a}`)
      );
    }

    if (this.metadata.limitations?.length) {
      sections.push(
        '\n## Model Limitations',
        ...this.metadata.limitations.map(l => `- ${l}`)
      );
    }

    if (this.metadata.references?.length) {
      sections.push(
        '\n## References',
        ...this.metadata.references.map(r => `- ${r}`)
      );
    }

    return sections.join('\n');
  }
} 