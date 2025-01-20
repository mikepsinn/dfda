export type ComponentMetadata = {
  assumptions?: string[];
  notes?: string[];
  tags?: string[];
  sourceUrl?: string;
  sourceQuote?: string;
};

/**
 * Abstract base class representing a core element of a population intervention model.
 * Each element has properties for display (id, name, description, etc.) and 
 * calculation (generating display values, JSON representation).
 * 
 * This serves as the foundation for both input parameters and outcome metrics,
 * providing common functionality for model elements that can be displayed,
 * documented, and used in calculations.
 * 
 * This class should never be instantiated directly - use InputParameter or 
 * OutcomeMetric instead.
 */
export abstract class AbstractModelElement {
  constructor(
    public readonly id: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly unitName: string,
    public readonly emoji: string,
    public readonly metadata?: ComponentMetadata
  ) {}

  abstract generateDisplayValue(): string;

  toJSON(): Omit<ComponentMetadata & {
    id: string;
    displayName: string;
    description: string;
    unitName: string;
    emoji: string;
  }, 'value'> {
    return {
      id: this.id,
      displayName: this.displayName,
      description: this.description,
      unitName: this.unitName,
      emoji: this.emoji,
      ...this.metadata
    };
  }
} 