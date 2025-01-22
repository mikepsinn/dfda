export const EMOJI_REGEX = /\p{Emoji}/u;

export type Metadata = {
  /** Key assumptions affecting this element's behavior */
  assumptions?: string[];
  /** Developer notes for implementation context */
  notes?: string[];
  /** Categorization tags for discovery */
  tags?: string[];
  /** URL to primary data source */
  sourceUrl?: string;
  /** Relevant excerpt from source material */
  sourceQuote?: string;
  /** Type-specific metadata extensions */
  extensions?: Record<string, unknown>;
};

export type ElementMetadata = Metadata & {
  /** Additional element-specific metadata */
};

export type ModelMetadata = Metadata & {
  /** Type of intervention (health, environmental, etc) */
  interventionType: 'health' | 'environmental' | 'educational' | 'social' | 'infrastructure' | 'economic' | 'other';
  /** Description of target population */
  populationDescription: string;
  /** Time horizon for analysis */
  timeHorizon: string;
  /** Geographic scope of analysis */
  geographicScope: string;
  /** Implementation phases */
  implementationPhases?: string[];
  /** Relevant stakeholders */
  stakeholders?: string[];
  /** Population subgroups */
  subgroups?: string[];
  /** Model limitations */
  limitations?: string[];
  /** References */
  references?: string[];
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
    public readonly metadata?: ElementMetadata
  ) {}

  abstract generateDisplayValue(): string;

  toJSON(): Omit<ElementMetadata & {
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