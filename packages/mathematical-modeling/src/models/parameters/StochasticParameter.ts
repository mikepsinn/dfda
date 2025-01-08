import { BaseParameter } from '../base/BaseParameter';

export interface DistributionParameters {
  mean: number;
  standardDeviation?: number;
  min?: number;
  max?: number;
  skewness?: number;
  kurtosis?: number;
}

export class StochasticParameter extends BaseParameter {
  constructor(
    id: string,
    displayName: string,
    defaultValue: number,
    unitName: string,
    description: string,
    sourceUrl: string,
    emoji: string,
    readonly distribution: 'normal' | 'uniform' | 'triangular' | 'beta',
    readonly distributionParams: DistributionParameters,
    readonly sampleSize: number = 1000,
    sourceQuote?: string,
    tags?: string[],
    metadata?: Record<string, unknown>
  ) {
    super(id, displayName, defaultValue, unitName, description, sourceUrl, emoji, sourceQuote, tags, metadata);
    this.validateDistribution();
  }

  generateDisplayValue(value: number): string {
    return `${value} ${this.unitName}`;
  }

  validate(value: number): boolean {
    // Basic validation - can be extended based on specific requirements
    return !isNaN(value) && isFinite(value) && this.validateValueForDistribution(value);
  }

  private validateValueForDistribution(value: number): boolean {
    switch (this.distribution) {
      case 'uniform':
      case 'triangular':
        const { min, max } = this.distributionParams;
        if (min !== undefined && max !== undefined) {
          return value >= min && value <= max;
        }
        break;
      case 'beta':
        return value >= 0 && value <= 1;
    }
    return true; // For normal distribution or when min/max not specified
  }

  private validateDistribution() {
    switch (this.distribution) {
      case 'normal':
        if (this.distributionParams.standardDeviation === undefined) {
          throw new Error('Normal distribution requires standard deviation');
        }
        break;
      case 'uniform':
        if (this.distributionParams.min === undefined || this.distributionParams.max === undefined) {
          throw new Error('Uniform distribution requires min and max values');
        }
        break;
      case 'triangular':
        if (this.distributionParams.min === undefined || this.distributionParams.max === undefined) {
          throw new Error('Triangular distribution requires min and max values');
        }
        break;
      case 'beta':
        if (this.distributionParams.skewness === undefined || this.distributionParams.kurtosis === undefined) {
          throw new Error('Beta distribution requires skewness and kurtosis');
        }
        break;
    }
  }

  generateSample(): number[] {
    switch (this.distribution) {
      case 'normal':
        return this.generateNormalSample();
      case 'uniform':
        return this.generateUniformSample();
      case 'triangular':
        return this.generateTriangularSample();
      case 'beta':
        return this.generateBetaSample();
      default:
        throw new Error(`Unsupported distribution: ${this.distribution}`);
    }
  }

  private generateNormalSample(): number[] {
    const { mean, standardDeviation } = this.distributionParams;
    if (!standardDeviation) throw new Error('Standard deviation is required for normal distribution');
    
    return Array.from({ length: this.sampleSize }, () => {
      // Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return mean + standardDeviation * z;
    });
  }

  private generateUniformSample(): number[] {
    const { min, max } = this.distributionParams;
    if (min === undefined || max === undefined) {
      throw new Error('Min and max values are required for uniform distribution');
    }
    
    return Array.from({ length: this.sampleSize }, () => 
      min + Math.random() * (max - min)
    );
  }

  private generateTriangularSample(): number[] {
    const { min, max, mean } = this.distributionParams;
    if (min === undefined || max === undefined) {
      throw new Error('Min and max values are required for triangular distribution');
    }
    
    return Array.from({ length: this.sampleSize }, () => {
      const u = Math.random();
      const c = (mean - min) / (max - min); // Mode
      if (u < c) {
        return min + Math.sqrt(u * (max - min) * (mean - min));
      } else {
        return max - Math.sqrt((1 - u) * (max - min) * (max - mean));
      }
    });
  }

  private generateBetaSample(): number[] {
    // This is a simplified beta distribution generation
    // For a proper implementation, we would need a more sophisticated algorithm
    const { mean, skewness } = this.distributionParams;
    if (skewness === undefined) {
      throw new Error('Skewness is required for beta distribution');
    }
    
    // Simplified beta using normal approximation
    return this.generateNormalSample().map(x => {
      const beta = Math.max(0, Math.min(1, x + skewness * (x - mean)));
      return beta;
    });
  }

  getStatistics(sample?: number[]): {
    mean: number;
    standardDeviation: number;
    min: number;
    max: number;
    median: number;
  } {
    const values = sample || this.generateSample();
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

    return {
      mean,
      standardDeviation: Math.sqrt(variance),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)]
    };
  }

  getConfidenceInterval(confidence: number = 0.95): [number, number] {
    const sample = this.generateSample();
    const sorted = [...sample].sort((a, b) => a - b);
    const lower = Math.floor((1 - confidence) / 2 * sample.length);
    const upper = Math.floor((1 + confidence) / 2 * sample.length);
    return [sorted[lower], sorted[upper]];
  }
} 