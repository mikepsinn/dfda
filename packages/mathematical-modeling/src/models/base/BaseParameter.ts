import { ModelComponent, ComponentMetadata } from './ModelComponent';

export type ParameterMetadata = ComponentMetadata & {
  costCategory?: 'fixed' | 'variable';
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

export class BaseParameter extends ModelComponent {
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
      ...super.toJSON() as Omit<ParameterJSON, 'value'>,
      value: this.value
    };
  }
} 