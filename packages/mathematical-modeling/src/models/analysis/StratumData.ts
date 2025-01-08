export class StratumData {
  constructor(
    readonly value: number,
    readonly sampleSize?: number,
    readonly standardError?: number,
    readonly confidenceLevel: number = 0.95
  ) {}

  getConfidenceInterval(): [number, number] | undefined {
    if (!this.standardError) return undefined;

    // Using z-score for 95% confidence level by default
    const zScore = 1.96; // For 95% confidence
    return [
      this.value - zScore * this.standardError,
      this.value + zScore * this.standardError
    ];
  }

  getMarginOfError(): number | undefined {
    if (!this.standardError) return undefined;
    const zScore = 1.96; // For 95% confidence
    return zScore * this.standardError;
  }

  getCoefficientOfVariation(): number | undefined {
    if (!this.standardError || this.value === 0) return undefined;
    return (this.standardError / Math.abs(this.value)) * 100;
  }

  isSignificantlyDifferent(other: StratumData, alpha: number = 0.05): boolean {
    if (!this.standardError || !other.standardError) return false;

    const difference = Math.abs(this.value - other.value);
    const pooledSE = Math.sqrt(
      Math.pow(this.standardError, 2) + Math.pow(other.standardError, 2)
    );
    const zScore = difference / pooledSE;
    const criticalValue = 1.96; // For alpha = 0.05

    return zScore > criticalValue;
  }

  toJSON(): string {
    return JSON.stringify({
      value: this.value,
      sampleSize: this.sampleSize,
      standardError: this.standardError,
      confidenceLevel: this.confidenceLevel
    }, null, 2);
  }

  static fromJSON(json: string): StratumData {
    const data = JSON.parse(json);
    return new StratumData(
      data.value,
      data.sampleSize,
      data.standardError,
      data.confidenceLevel
    );
  }
} 