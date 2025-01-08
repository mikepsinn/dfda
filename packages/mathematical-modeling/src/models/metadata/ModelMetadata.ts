export interface Reference {
  citation: string;
  doi?: string;
  url?: string;
}

export interface ValidationStatus {
  status: 'draft' | 'peer-reviewed' | 'validated';
  validatedBy?: string[];
  validationDate?: string;
  validationMethod?: string;
}

export class ModelMetadata {
  constructor(
    readonly authors?: string[],
    readonly lastUpdated?: string,
    readonly references?: Reference[],
    readonly assumptions?: string[],
    readonly limitations?: string[],
    readonly validationStatus?: ValidationStatus
  ) {}

  isValidated(): boolean {
    return this.validationStatus?.status === 'validated';
  }

  isPeerReviewed(): boolean {
    return this.validationStatus?.status === 'peer-reviewed';
  }

  getLastUpdatedDate(): Date | undefined {
    return this.lastUpdated ? new Date(this.lastUpdated) : undefined;
  }

  getValidationDate(): Date | undefined {
    return this.validationStatus?.validationDate 
      ? new Date(this.validationStatus.validationDate)
      : undefined;
  }

  getCitations(): string[] {
    return this.references?.map(ref => ref.citation) ?? [];
  }

  getDOIs(): string[] {
    return this.references?.map(ref => ref.doi).filter((doi): doi is string => !!doi) ?? [];
  }

  getURLs(): string[] {
    return this.references?.map(ref => ref.url).filter((url): url is string => !!url) ?? [];
  }

  hasAssumption(assumption: string): boolean {
    return this.assumptions?.includes(assumption) ?? false;
  }

  hasLimitation(limitation: string): boolean {
    return this.limitations?.includes(limitation) ?? false;
  }

  wasValidatedBy(validator: string): boolean {
    return this.validationStatus?.validatedBy?.includes(validator) ?? false;
  }

  toJSON(): string {
    return JSON.stringify({
      authors: this.authors,
      lastUpdated: this.lastUpdated,
      references: this.references,
      assumptions: this.assumptions,
      limitations: this.limitations,
      validationStatus: this.validationStatus
    }, null, 2);
  }

  static fromJSON(json: string): ModelMetadata {
    const data = JSON.parse(json);
    return new ModelMetadata(
      data.authors,
      data.lastUpdated,
      data.references,
      data.assumptions,
      data.limitations,
      data.validationStatus
    );
  }
} 