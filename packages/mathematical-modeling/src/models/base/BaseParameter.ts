export type ParameterMetadata = {
  costCategory?: 'fixed' | 'variable';
  source?: string;
  assumptions?: string[];
  notes?: string[];
};

export type ParameterJSON = {
  id: string;
  displayName: string;
  value: number;
  unitName: string;
  description: string;
  emoji: string;
  metadata?: ParameterMetadata;
};

export class BaseParameter {
  constructor(
    readonly id: string,
    readonly displayName: string,
    public value: number,
    readonly unitName: string,
    readonly description: string,
    readonly emoji: string,
    readonly metadata?: ParameterMetadata
  ) {}

  validate(value: number): boolean {
    return !isNaN(value) && isFinite(value);
  }

  generateDisplayValue(): string {
    return `${this.value}${this.unitName ? ` ${this.unitName}` : ''}`;
  }

  setValue(newValue: number): void {
    if (!this.validate(newValue)) {
      throw new Error(`Invalid value ${newValue} for parameter ${this.id}`);
    }
    this.value = newValue;
  }

  toJSON(): ParameterJSON {
    return {
      id: this.id,
      displayName: this.displayName,
      value: this.value,
      unitName: this.unitName,
      description: this.description,
      emoji: this.emoji,
      metadata: this.metadata
    };
  }
} 