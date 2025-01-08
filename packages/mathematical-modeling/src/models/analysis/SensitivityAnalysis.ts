export class SensitivityAnalysis {
  constructor(
    readonly method: string,
    readonly results: Record<string, {
      value: number;
      impact: number;
      rank?: number;
    }>,
    readonly visualizations?: Record<string, unknown>
  ) {}

  getRankedParameters(): string[] {
    return Object.entries(this.results)
      .sort((a, b) => (b[1].impact - a[1].impact))
      .map(([id]) => id);
  }

  getTopInfluencers(count: number = 5): string[] {
    return this.getRankedParameters().slice(0, count);
  }
} 