import { BaseParameter } from './BaseParameter';

export abstract class OutcomeMetric extends BaseParameter {
  constructor(
    config: {
      id: string;
      displayName: string;
      defaultValue: number;
      unitName: string;
      description: string;
      sourceUrl: string;
      emoji: string;
      sourceQuote?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    },
    readonly modelParameters: Record<string, BaseParameter>
  ) {
    super(
      config.id,
      config.displayName,
      config.defaultValue,
      config.unitName,
      config.description,
      config.sourceUrl,
      config.emoji,
      config.sourceQuote,
      config.tags,
      config.metadata
    );
  }

  abstract calculate(): number;
  abstract generateCalculationExplanation(): string;

  protected getParameterValue(id: string): number {
    const param = this.modelParameters[id];
    if (!param) {
      throw new Error(`Parameter ${id} not found`);
    }
    return param.defaultValue;
  }
} 