import { BaseParameter } from '../base/BaseParameter';
import { StratificationResult } from '../analysis/StratificationResult';
import { StratumData } from '../analysis/StratumData';

export interface Stratum {
  id: string;
  name: string;
  value: number;
  weight?: number;
  sampleSize?: number;
  standardError?: number;
}

export class StratifiedParameter extends BaseParameter {
  private strata: Map<string, Stratum> = new Map();
  private defaultWeight: number = 1;

  constructor(
    id: string,
    displayName: string,
    defaultValue: number,
    unitName: string,
    description: string,
    sourceUrl: string,
    emoji: string,
    strata: Stratum[] = [],
    sourceQuote?: string,
    tags?: string[],
    metadata?: Record<string, unknown>
  ) {
    super(id, displayName, defaultValue, unitName, description, sourceUrl, emoji, sourceQuote, tags, metadata);
    this.setStrata(strata);
  }

  generateDisplayValue(value: number): string {
    return `${value} ${this.unitName}`;
  }

  validate(value: number): boolean {
    // Basic validation - can be extended based on specific requirements
    return !isNaN(value) && isFinite(value);
  }

  setStrata(strata: Stratum[]) {
    this.strata.clear();
    strata.forEach(stratum => {
      if (this.validate(stratum.value)) {
        this.strata.set(stratum.id, {
          ...stratum,
          weight: stratum.weight ?? this.defaultWeight
        });
      } else {
        throw new Error(`Invalid value for stratum ${stratum.id}`);
      }
    });
  }

  addStratum(stratum: Stratum) {
    if (!this.validate(stratum.value)) {
      throw new Error(`Invalid value for stratum ${stratum.id}`);
    }
    this.strata.set(stratum.id, {
      ...stratum,
      weight: stratum.weight ?? this.defaultWeight
    });
  }

  removeStratum(id: string) {
    this.strata.delete(id);
  }

  getStratum(id: string): Stratum | undefined {
    return this.strata.get(id);
  }

  getAllStrata(): Stratum[] {
    return Array.from(this.strata.values());
  }

  getStratumValue(id: string): number {
    const stratum = this.strata.get(id);
    if (!stratum) {
      throw new Error(`Stratum ${id} not found`);
    }
    return stratum.value;
  }

  setStratumValue(id: string, value: number) {
    if (!this.validate(value)) {
      throw new Error(`Invalid value for stratum ${id}`);
    }
    const stratum = this.strata.get(id);
    if (!stratum) {
      throw new Error(`Stratum ${id} not found`);
    }
    this.strata.set(id, { ...stratum, value });
  }

  getWeightedAverage(): number {
    let totalWeight = 0;
    let weightedSum = 0;

    this.strata.forEach(stratum => {
      const weight = stratum.weight ?? this.defaultWeight;
      totalWeight += weight;
      weightedSum += stratum.value * weight;
    });

    return weightedSum / totalWeight;
  }

  analyze(): StratificationResult {
    const overall = this.getWeightedAverage();
    const strata: Record<string, StratumData> = {};

    // Convert strata to StratumData objects
    this.strata.forEach(stratum => {
      strata[stratum.id] = new StratumData(
        stratum.value,
        stratum.sampleSize,
        stratum.standardError
      );
    });

    // Calculate variance decomposition
    let totalSS = 0;
    let betweenSS = 0;
    let withinSS = 0;

    this.strata.forEach(stratum => {
      const weight = stratum.weight ?? this.defaultWeight;
      betweenSS += weight * Math.pow(stratum.value - overall, 2);

      if (stratum.standardError) {
        withinSS += weight * Math.pow(stratum.standardError, 2);
      }

      if (stratum.sampleSize && stratum.standardError) {
        totalSS += weight * stratum.sampleSize * Math.pow(stratum.standardError, 2);
      }
    });

    return new StratificationResult(overall, strata, {
      betweenGroupVariance: betweenSS,
      withinGroupVariance: withinSS,
      explainedVariance: betweenSS / (betweenSS + withinSS)
    });
  }

  getStratificationSummary(): {
    totalStrata: number;
    weightedMean: number;
    minValue: number;
    maxValue: number;
    valueRange: number;
  } {
    const values = Array.from(this.strata.values()).map(s => s.value);
    const weightedMean = this.getWeightedAverage();
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return {
      totalStrata: this.strata.size,
      weightedMean,
      minValue,
      maxValue,
      valueRange: maxValue - minValue
    };
  }

  findOutliers(threshold: number = 2): Stratum[] {
    const { weightedMean } = this.getStratificationSummary();
    const standardDeviation = Math.sqrt(
      Array.from(this.strata.values()).reduce((acc, stratum) => {
        const weight = stratum.weight ?? this.defaultWeight;
        return acc + weight * Math.pow(stratum.value - weightedMean, 2);
      }, 0) / this.strata.size
    );

    return Array.from(this.strata.values()).filter(stratum => 
      Math.abs(stratum.value - weightedMean) > threshold * standardDeviation
    );
  }
} 