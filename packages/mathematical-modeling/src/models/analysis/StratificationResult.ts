export class StratificationResult {
  constructor(
    readonly overall: number,
    readonly strata: Record<string, {
      value: number;
      sampleSize?: number;
      uncertainty?: {
        standardError?: number;
        confidenceInterval?: [number, number];
      };
    }>,
    readonly decomposition?: {
      betweenGroupVariance: number;
      withinGroupVariance: number;
      explainedVariance: number;
    }
  ) {}

  getStrataCount(): number {
    return Object.keys(this.strata).length;
  }

  getStrataValues(): number[] {
    return Object.values(this.strata).map(s => s.value);
  }

  getStrataNames(): string[] {
    return Object.keys(this.strata);
  }

  getStratumValue(stratum: string): number {
    const value = this.strata[stratum]?.value;
    if (value === undefined) {
      throw new Error(`Stratum ${stratum} not found`);
    }
    return value;
  }

  getConfidenceInterval(stratum: string): [number, number] | undefined {
    return this.strata[stratum]?.uncertainty?.confidenceInterval;
  }

  getVarianceExplained(): number | undefined {
    if (!this.decomposition) return undefined;
    const { betweenGroupVariance, withinGroupVariance } = this.decomposition;
    const totalVariance = betweenGroupVariance + withinGroupVariance;
    return betweenGroupVariance / totalVariance;
  }

  getTopStrata(count: number = 5): Array<[string, number]> {
    return Object.entries(this.strata)
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, count)
      .map(([name, { value }]) => [name, value]);
  }

  getBottomStrata(count: number = 5): Array<[string, number]> {
    return Object.entries(this.strata)
      .sort(([, a], [, b]) => a.value - b.value)
      .slice(0, count)
      .map(([name, { value }]) => [name, value]);
  }

  getStatistics() {
    const values = this.getStrataValues();
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

    return {
      mean,
      standardDeviation: Math.sqrt(variance),
      min: Math.min(...values),
      max: Math.max(...values),
      median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
    };
  }
} 