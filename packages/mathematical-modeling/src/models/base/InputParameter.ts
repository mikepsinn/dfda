import { AbstractModelElement, ModelMetadata } from './AbstractModelElement';

export type ParameterMetadata = ModelMetadata & {
  costCategory?: 'fixed' | 'variable';
};

export type ParameterJSON = ReturnType<AbstractModelElement['toJSON']> & {
  value: number;
  metadata?: ParameterMetadata;
};

export interface ParameterConstraints {
  min?: number;
  max?: number;
  step?: number;
  allowedValues?: number[];
}

/**
 * Represents an input parameter that can be adjusted to analyze different scenarios
 * in a population intervention model. Examples include costs, rates, durations,
 * population sizes, or any other numeric value that affects model outcomes.
 */
export class InputParameter extends AbstractModelElement {
  constructor(
    id: string,
    displayName: string,
    public value: number,
    unitName: string,
    description: string,
    emoji: string,
    metadata?: ParameterMetadata
  ) {
    super(id, displayName, description, unitName, emoji, metadata);
  }

  validate(value: number, constraints?: ParameterConstraints): boolean {
    if (!Number.isFinite(value)) return false;
    
    if (constraints) {
      if (constraints.min !== undefined && value < constraints.min) return false;
      if (constraints.max !== undefined && value > constraints.max) return false;
      if (constraints.step !== undefined && (value % constraints.step) !== 0) return false;
      if (constraints.allowedValues && !constraints.allowedValues.includes(value)) return false;
    }
    
    return true;
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
      ...super.toJSON() as Omit<ParameterJSON, 'value'>,
      value: this.value
    };
  }
} 