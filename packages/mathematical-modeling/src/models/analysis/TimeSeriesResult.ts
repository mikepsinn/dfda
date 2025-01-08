export class TimeSeriesResult {
  constructor(
    readonly timePoints: number[],
    readonly values: number[],
    readonly metadata: {
      seasonalComponents?: number[];
      trendComponent?: number[];
      residuals?: number[];
      fitMetrics?: Record<string, number>;
    } = {}
  ) {
    if (timePoints.length !== values.length) {
      throw new Error('Time points and values must have the same length');
    }
  }

  getValueAtTime(time: number): number {
    const index = this.timePoints.indexOf(time);
    if (index === -1) {
      throw new Error(`No value for time point ${time}`);
    }
    return this.values[index];
  }

  getTimeRange(): [number, number] {
    return [this.timePoints[0], this.timePoints[this.timePoints.length - 1]];
  }

  getStatistics() {
    const mean = this.values.reduce((a, b) => a + b, 0) / this.values.length;
    const variance = this.values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.values.length;
    return {
      mean,
      standardDeviation: Math.sqrt(variance),
      min: Math.min(...this.values),
      max: Math.max(...this.values)
    };
  }

  getTrend(): 'increasing' | 'decreasing' | 'stable' {
    const firstHalf = this.values.slice(0, Math.floor(this.values.length / 2));
    const secondHalf = this.values.slice(Math.floor(this.values.length / 2));
    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const difference = secondMean - firstMean;
    const threshold = 0.1 * firstMean; // 10% change threshold

    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }

  hasSeasonality(): boolean {
    return this.metadata.seasonalComponents?.length ? true : false;
  }

  getFitQuality(): { r2: number; rmse: number } {
    return {
      r2: this.metadata.fitMetrics?.r2 ?? 0,
      rmse: this.metadata.fitMetrics?.rmse ?? 0
    };
  }
} 