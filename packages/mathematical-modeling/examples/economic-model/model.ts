import { BaseModel, ModelParameter, OutcomeMetric } from '../../src/types';
import * as parameters from './parameters';
import * as outcomes from './outcomes';

function formatCurrency(value: number, scale: 'millions' | 'none' = 'none'): string {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }

  const scaledValue = scale === 'millions' ? value / 1_000_000 : value;
  const formatted = scaledValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `$${formatted}${scale === 'millions' ? 'M' : ''}`;
}

export class EconomicModel extends BaseModel {
  constructor() {
    super({
      id: 'economic_model',
      title: 'Economic Impact Model',
      description: 'Model for calculating economic impacts of healthcare interventions',
      version: '1.0.0',
      parameters: Object.values(parameters) as ModelParameter[],
      metrics: Object.values(outcomes) as OutcomeMetric[],
      metadata: {
        authors: ['Example Author'],
        lastUpdated: new Date().toISOString(),
        assumptions: [
          'Assumes linear scaling of costs',
          'Assumes constant regulatory environment'
        ],
        limitations: [
          'Does not account for market competition',
          'Limited to US market dynamics'
        ]
      }
    });
  }

  override generateMarkdownReport(): string {
    const parametersRecord = this.getParametersAsRecord();
    
    const report = [
      `# ${this.title}`,
      '',
      `## Overview`,
      this.description,
      '',
      `## Parameters`,
      ...this.parameters.map(p => [
        `### ${p.displayName} (${p.emoji})`,
        p.description,
        `- Default: ${formatCurrency(p.defaultValue)} ${p.unitName}`,
        `- Source: ${p.sourceUrl}`,
        p.sourceQuote ? `- Quote: "${p.sourceQuote}"` : '',
        ''
      ].filter(Boolean).join('\n')),
      '',
      `## Results`,
      ...this.metrics.map(metric => [
        `### ${metric.displayName} (${metric.emoji})`,
        `Value: ${formatCurrency(this.calculateMetric(metric.id))} ${metric.unitName}`,
        `Explanation: ${metric.generateCalculationExplanation(parametersRecord)}`,
        ''
      ].join('\n')),
      '',
      `## Assumptions`,
      ...(this.metadata?.assumptions?.map(a => `- ${a}`) ?? []),
      '',
      `## Limitations`,
      ...(this.metadata?.limitations?.map(l => `- ${l}`) ?? []),
      '',
      `Generated on: ${new Date().toISOString()}`
    ].join('\n');

    return report;
  }
}
