import {
  Model as ModelInterface,
  ModelParameter,
  OutcomeMetric,
  SensitivityAnalysis,
  UncertaintyAnalysis,
  TimeSeriesResult,
  StratificationResult
} from './types';

export class Model implements ModelInterface {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly description: string,
    readonly version: string,
    readonly metadata: ModelInterface['metadata'],
    readonly parameters: ModelParameter[],
    readonly metrics: OutcomeMetric[]
  ) {
    // Initialize with default values
    this.parameterValues = Object.fromEntries(
      parameters.map(p => [p.id, p])
    );
  }

  private parameterValues: Record<string, ModelParameter>;

  private validateMetricValue(value: number, metric: OutcomeMetric): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  getMetric(id: string): OutcomeMetric | undefined {
    return this.metrics.find(m => m.id === id);
  }

  getParameter(id: string): ModelParameter | undefined {
    return this.parameters.find(p => p.id === id);
  }

  setParameterValue(id: string, value: number): void {
    const parameter = this.getParameter(id);
    if (!parameter) {
      throw new Error(`Parameter ${id} not found`);
    }
    this.parameterValues[id] = { ...parameter, defaultValue: value };
  }

  calculateMetric(id: string): number {
    const metric = this.getMetric(id);
    if (!metric) {
      throw new Error(`Metric ${id} not found`);
    }
    const result = metric.calculate(this.parameterValues);
    if (!this.validateMetricValue(result, metric)) {
      throw new Error(`Invalid calculation result for metric ${id}: ${result}`);
    }
    return result;
  }

  calculateSensitivity(metricId: string): SensitivityAnalysis | undefined {
    const metric = this.getMetric(metricId);
    if (!metric || !metric.sensitivity) {
      return undefined;
    }
    return metric.sensitivity.calculate(this.parameterValues);
  }

  calculateUncertainty(metricId: string): UncertaintyAnalysis | undefined {
    const metric = this.getMetric(metricId);
    if (!metric || !metric.uncertainty) {
      return undefined;
    }
    return metric.uncertainty.calculate(this.parameterValues);
  }

  calculateTimeSeries(metricId: string): TimeSeriesResult | undefined {
    const metric = this.getMetric(metricId);
    if (!metric || !metric.timeSeries) {
      return undefined;
    }
    return metric.timeSeries.calculate(this.parameterValues);
  }

  calculateBySubgroup(metricId: string, strata: string[]): StratificationResult | undefined {
    const metric = this.getMetric(metricId);
    if (!metric || !metric.stratification) {
      return undefined;
    }
    return metric.stratification.calculate(this.parameterValues, strata);
  }

  generateMarkdownReport(): string {
    return [
      `# ${this.title} v${this.version}`,
      '',
      '## Overview',
      this.description,
      '',
      '## Parameters',
      ...this.parameters.map(p => [
        `### ${p.displayName} (${p.emoji})`,
        p.description,
        `- Value: ${p.generateDisplayValue(this.parameterValues[p.id]?.defaultValue ?? p.defaultValue)}`,
        `- Source: ${p.sourceUrl}`,
        p.sourceQuote ? `- Quote: "${p.sourceQuote}"` : '',
        ''
      ].filter(Boolean).join('\n')),
      '',
      '## Outcomes',
      ...this.metrics.map(m => [
        `### ${m.displayName} (${m.emoji})`,
        m.description,
        `- Value: ${m.generateDisplayValue(this.calculateMetric(m.id))}`,
        `- Explanation: ${m.generateCalculationExplanation(this.parameterValues)}`,
        ''
      ].join('\n')),
      '',
      this.metadata?.assumptions?.length ? [
        '## Assumptions',
        ...this.metadata.assumptions.map(a => `- ${a}`),
        ''
      ].join('\n') : '',
      this.metadata?.limitations?.length ? [
        '## Limitations',
        ...this.metadata.limitations.map(l => `- ${l}`),
        ''
      ].join('\n') : '',
      this.metadata?.references?.length ? [
        '## References',
        ...this.metadata.references.map(r => 
          `- ${r.citation}${r.doi ? ` (DOI: ${r.doi})` : ''}${r.url ? ` [Link](${r.url})` : ''}`
        ),
        ''
      ].join('\n') : '',
      `Generated on: ${new Date().toISOString()}`
    ].filter(Boolean).join('\n');
  }
}
