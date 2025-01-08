import { BaseParameter } from '../base/BaseParameter';
import { TimeSeriesResult } from '../analysis/TimeSeriesResult';
import { FitMetrics } from '../analysis/FitMetrics';

export interface TimePoint {
  time: number;
  value: number;
  uncertainty?: {
    standardError?: number;
    confidenceInterval?: [number, number];
  };
}

export class TimeSeriesParameter extends BaseParameter {
  private timePoints: TimePoint[] = [];

  constructor(
    id: string,
    displayName: string,
    defaultValue: number,
    unitName: string,
    description: string,
    sourceUrl: string,
    emoji: string,
    timePoints: TimePoint[] = [],
    sourceQuote?: string,
    tags?: string[],
    metadata?: Record<string, unknown>
  ) {
    super(id, displayName, defaultValue, unitName, description, sourceUrl, emoji, sourceQuote, tags, metadata);
    this.setTimePoints(timePoints);
  }

  generateDisplayValue(value: number): string {
    return `${value} ${this.unitName}`;
  }

  validate(value: number): boolean {
    // Basic validation - can be extended based on specific requirements
    return !isNaN(value) && isFinite(value);
  }

  setTimePoints(points: TimePoint[]) {
    // Validate all points before setting
    points.forEach(point => {
      if (!this.validate(point.value)) {
        throw new Error(`Invalid value at time ${point.time}`);
      }
    });

    // Ensure time points are sorted
    this.timePoints = [...points].sort((a, b) => a.time - b.time);
  }

  getTimePoints(): TimePoint[] {
    return [...this.timePoints];
  }

  getValueAtTime(time: number): number {
    const point = this.timePoints.find(p => p.time === time);
    if (point) return point.value;

    // Interpolate between points
    const next = this.timePoints.find(p => p.time > time);
    const prev = [...this.timePoints].reverse().find(p => p.time < time);

    if (!prev || !next) {
      throw new Error(`No data available to interpolate value at time ${time}`);
    }

    // Linear interpolation
    const timeFraction = (time - prev.time) / (next.time - prev.time);
    return prev.value + timeFraction * (next.value - prev.value);
  }

  getTimeRange(): [number, number] {
    if (this.timePoints.length === 0) {
      throw new Error('No time points available');
    }
    return [
      this.timePoints[0].time,
      this.timePoints[this.timePoints.length - 1].time
    ];
  }

  detectSeasonality(): {
    hasSeasonal: boolean;
    period?: number;
    strength?: number;
  } {
    if (this.timePoints.length < 4) {
      return { hasSeasonal: false };
    }

    const values = this.timePoints.map(p => p.value);
    const n = values.length;
    
    // Simple autocorrelation check
    let maxCorr = 0;
    let bestPeriod = 0;
    
    // Check periods up to 1/4 of series length
    for (let period = 2; period <= Math.floor(n / 4); period++) {
      let corr = 0;
      let count = 0;
      
      for (let i = 0; i < n - period; i++) {
        corr += (values[i] - values[i + period]) ** 2;
        count++;
      }
      
      corr = 1 / (1 + corr / count); // Convert to similarity measure
      
      if (corr > maxCorr) {
        maxCorr = corr;
        bestPeriod = period;
      }
    }

    const seasonalStrength = maxCorr > 0.7 ? maxCorr : undefined;
    
    return {
      hasSeasonal: maxCorr > 0.7,
      period: maxCorr > 0.7 ? bestPeriod : undefined,
      strength: seasonalStrength
    };
  }

  decompose(): TimeSeriesResult {
    const times = this.timePoints.map(p => p.time);
    const values = this.timePoints.map(p => p.value);
    
    // Simple moving average for trend
    const windowSize = 3;
    const trend = values.map((_, i) => {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(values.length, i + windowSize + 1);
      const window = values.slice(start, end);
      return window.reduce((a, b) => a + b, 0) / window.length;
    });

    // Remove trend to get seasonal + residual
    const detrended = values.map((v, i) => v - trend[i]);

    // Calculate seasonal component (if any)
    const { hasSeasonal, period } = this.detectSeasonality();
    let seasonal: number[] = Array(values.length).fill(0);
    
    if (hasSeasonal && period) {
      // Average values at seasonal lags
      for (let i = 0; i < period; i++) {
        const seasonalValues = [];
        for (let j = i; j < values.length; j += period) {
          seasonalValues.push(detrended[j]);
        }
        const avg = seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length;
        for (let j = i; j < values.length; j += period) {
          seasonal[j] = avg;
        }
      }
    }

    // Residuals
    const residuals = values.map((v, i) => v - trend[i] - seasonal[i]);

    // Calculate fit metrics
    const predictions = trend.map((t, i) => t + seasonal[i]);
    const rmse = Math.sqrt(
      residuals.reduce((a, b) => a + b * b, 0) / residuals.length
    );
    const totalSS = values.reduce((a, v) => a + Math.pow(v - values.reduce((a, b) => a + b, 0) / values.length, 2), 0);
    const residualSS = residuals.reduce((a, r) => a + r * r, 0);
    const r2 = 1 - (residualSS / totalSS);

    const metrics = new FitMetrics(r2, rmse);
    const fitMetricsRecord: Record<string, number> = {
      r2: metrics.r2,
      rmse: metrics.rmse
    };
    if (metrics.mae !== undefined) fitMetricsRecord.mae = metrics.mae;
    if (metrics.aic !== undefined) fitMetricsRecord.aic = metrics.aic;
    if (metrics.bic !== undefined) fitMetricsRecord.bic = metrics.bic;

    return new TimeSeriesResult(times, values, {
      trendComponent: trend,
      seasonalComponents: seasonal,
      residuals,
      fitMetrics: fitMetricsRecord
    });
  }

  forecast(horizon: number): TimeSeriesResult {
    const decomposition = this.decompose();
    const { trendComponent, seasonalComponents } = decomposition.metadata;
    
    if (!trendComponent || !seasonalComponents) {
      throw new Error('Decomposition required for forecasting');
    }

    const lastTime = this.timePoints[this.timePoints.length - 1].time;
    const timeStep = this.timePoints[1].time - this.timePoints[0].time;
    
    const forecastTimes: number[] = [];
    const forecastValues: number[] = [];
    
    for (let i = 1; i <= horizon; i++) {
      const time = lastTime + i * timeStep;
      forecastTimes.push(time);
      
      // Simple linear extrapolation of trend
      const trendSlope = (trendComponent[trendComponent.length - 1] - trendComponent[trendComponent.length - 2]) / timeStep;
      const forecastTrend = trendComponent[trendComponent.length - 1] + trendSlope * i * timeStep;
      
      // Repeat seasonal pattern
      const seasonalIndex = (this.timePoints.length + i - 1) % seasonalComponents.length;
      const forecastSeasonal = seasonalComponents[seasonalIndex];
      
      forecastValues.push(forecastTrend + forecastSeasonal);
    }

    return new TimeSeriesResult(forecastTimes, forecastValues);
  }
} 