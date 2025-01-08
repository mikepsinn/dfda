export interface TimePoint {
  time: Date;
  value: number;
  uncertainty?: {
    lowerBound: number;
    upperBound: number;
    confidenceLevel: number;
  };
}

export interface TimeSeriesResult {
  points: TimePoint[];
  trend: {
    slope: number;
    intercept: number;
    r2: number;
  };
  summary: {
    mean: number;
    standardDeviation: number;
    min: number;
    max: number;
  };
  metadata?: Record<string, unknown>;
} 