import { OutcomeMetric, ModelParameter, ModelConfig } from '../../src/types';
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

export const economicModel: ModelConfig = {
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
  },
  generateMarkdownReport: (results: Record<string, number>): string => {
    const report = [
      `# Economic Impact Model`,
      '',
      `## Overview`,
      'Model for calculating economic impacts of healthcare interventions',
      '',
      `## Parameters`,
      ...economicModel.parameters.map(p => [
        `### ${p.displayName} (${p.emoji})`,
        p.description,
        `- Default: ${formatCurrency(p.defaultValue)} ${p.unitName}`,
        `- Source: ${p.sourceUrl}`,
        p.sourceQuote ? `- Quote: "${p.sourceQuote}"` : '',
        ''
      ].filter(Boolean).join('\n')),
      '',
      `## Results`,
      ...Object.entries(results).map(([id, value]) => {
        const metric = economicModel.metrics.find(m => m.id === id);
        if (!metric) return '';
        return [
          `### ${metric.displayName} (${metric.emoji})`,
          `Value: ${formatCurrency(value)} ${metric.unitName}`,
          `Explanation: ${metric.generateCalculationExplanation(results)}`,
          ''
        ].join('\n');
      }),
      '',
      `## Assumptions`,
      ...(economicModel.metadata?.assumptions?.map(a => `- ${a}`) ?? []),
      '',
      `## Limitations`,
      ...(economicModel.metadata?.limitations?.map(l => `- ${l}`) ?? []),
      '',
      `Generated on: ${new Date().toISOString()}`
    ].join('\n');

    return report;
  }
};
