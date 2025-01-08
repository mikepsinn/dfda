import { BaseParameter } from '../base/BaseParameter';

export class DeterministicParameter extends BaseParameter {
  constructor(
    id: string,
    displayName: string,
    defaultValue: number,
    unitName: string,
    description: string,
    sourceUrl: string,
    emoji: string,
    readonly minValue?: number,
    readonly maxValue?: number,
    readonly suggestedRange?: [number, number],
    readonly scalingFunction?: (value: number) => number,
    readonly dependentParameters?: string[],
    sourceQuote?: string,
    tags?: string[],
    metadata?: Record<string, unknown>
  ) {
    super(id, displayName, defaultValue, unitName, description, sourceUrl, emoji, sourceQuote, tags, metadata);
  }

  generateDisplayValue(value: number): string {
    return `${value} ${this.unitName}`;
  }

  validate(value: number): boolean {
    if (!isNaN(value) && !isFinite(value)) return false;
    if (this.minValue !== undefined && value < this.minValue) return false;
    if (this.maxValue !== undefined && value > this.maxValue) return false;
    return true;
  }

  scale(value: number): number {
    return this.scalingFunction ? this.scalingFunction(value) : value;
  }

  getDependentParameters(): string[] {
    return this.dependentParameters ?? [];
  }

  getSuggestedRange(): [number, number] {
    return this.suggestedRange ?? [
      this.minValue ?? -Infinity,
      this.maxValue ?? Infinity
    ];
  }

  isWithinRange(value: number): boolean {
    return this.validate(value);
  }

  getConstraints(): {
    min?: number;
    max?: number;
    suggestedMin?: number;
    suggestedMax?: number;
  } {
    return {
      min: this.minValue,
      max: this.maxValue,
      suggestedMin: this.suggestedRange?.[0],
      suggestedMax: this.suggestedRange?.[1]
    };
  }
} 