export class UncertaintyAnalysis {
  constructor(
    readonly method: string,
    readonly summary: {
      mean: number;
      median?: number;
      standardDeviation: number;
      confidenceInterval: [number, number];
      percentiles?: Record<number, number>;
    },
    readonly distribution?: {
      type: string;
      parameters: Record<string, number>;
    },
    readonly samples?: number[]
  ) {}

  getConfidenceInterval(level: number = 0.95): [number, number] {
    if (level === 0.95) return this.summary.confidenceInterval;
    if (!this.samples) throw new Error('Samples required for custom confidence intervals');
    
    const sorted = [...this.samples].sort((a, b) => a - b);
    const lower = Math.floor((1 - level) / 2 * sorted.length);
    const upper = Math.floor((1 + level) / 2 * sorted.length);
    return [sorted[lower], sorted[upper]];
  }

  getPercentile(p: number): number {
    if (this.summary.percentiles?.[p] !== undefined) {
      return this.summary.percentiles[p];
    }
    if (!this.samples) throw new Error('Samples required for custom percentiles');
    
    const sorted = [...this.samples].sort((a, b) => a - b);
    const index = Math.floor(p / 100 * sorted.length);
    return sorted[index];
  }
} 