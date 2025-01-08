export class FitMetrics {
  constructor(
    readonly r2: number,
    readonly rmse: number,
    readonly mae?: number,
    readonly aic?: number,
    readonly bic?: number
  ) {
    this.validateMetrics();
  }

  private validateMetrics() {
    if (this.r2 < 0 || this.r2 > 1) {
      throw new Error('R-squared must be between 0 and 1');
    }
    if (this.rmse < 0) {
      throw new Error('RMSE must be non-negative');
    }
    if (this.mae !== undefined && this.mae < 0) {
      throw new Error('MAE must be non-negative');
    }
  }

  getFitQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (this.r2 > 0.9) return 'excellent';
    if (this.r2 > 0.7) return 'good';
    if (this.r2 > 0.5) return 'fair';
    return 'poor';
  }

  isBetterThan(other: FitMetrics): boolean {
    // Primary criterion: R-squared
    if (this.r2 > other.r2) return true;
    if (this.r2 < other.r2) return false;

    // Secondary criterion: RMSE
    if (this.rmse < other.rmse) return true;
    if (this.rmse > other.rmse) return false;

    // If both metrics are equal, consider AIC if available
    if (this.aic !== undefined && other.aic !== undefined) {
      return this.aic < other.aic;
    }

    return false;
  }

  getRelativeImprovement(baseline: FitMetrics): {
    r2Improvement: number;
    rmseReduction: number;
  } {
    return {
      r2Improvement: ((this.r2 - baseline.r2) / baseline.r2) * 100,
      rmseReduction: ((baseline.rmse - this.rmse) / baseline.rmse) * 100
    };
  }

  toJSON(): string {
    return JSON.stringify({
      r2: this.r2,
      rmse: this.rmse,
      mae: this.mae,
      aic: this.aic,
      bic: this.bic
    }, null, 2);
  }

  static fromJSON(json: string): FitMetrics {
    const data = JSON.parse(json);
    return new FitMetrics(
      data.r2,
      data.rmse,
      data.mae,
      data.aic,
      data.bic
    );
  }
} 