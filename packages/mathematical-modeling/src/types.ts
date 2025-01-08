export interface BaseParameter {
  id: string;
  displayName: string;
  defaultValue: number;
  unitName: string;
  description: string;
  sourceUrl: string;
  emoji: string;
  sourceQuote?: string;
  generateDisplayValue: (value: number) => string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface DeterministicParameter extends BaseParameter {
  parameterType: 'deterministic';
  // Bounds and validation
  minValue?: number;
  maxValue?: number;
  suggestedRange?: [number, number];
  validation?: (value: number) => boolean;
  // Optional scaling/relationship functions
  scalingFunction?: (value: number) => number;
  dependentParameters?: string[]; // IDs of parameters this one affects
}

export interface StochasticParameter extends BaseParameter {
  parameterType: 'stochastic';
  // Statistical properties
  distributionType: 'normal' | 'lognormal' | 'beta' | 'gamma' | 'uniform' | 'custom';
  distributionParameters: Record<string, number>;
  // Sampling configuration
  sampleSize?: number;
  seed?: number;
  // Optional correlation with other parameters
  correlations?: Record<string, number>; // parameter_id -> correlation coefficient
}

export interface TimeSeriesParameter extends BaseParameter {
  parameterType: 'time_series';
  // Time properties
  timeUnit: string;
  timeHorizon: {
    start: number;
    end: number;
    step: number;
  };
  // Time series characteristics
  seasonality?: boolean;
  trend?: 'linear' | 'exponential' | 'custom';
  interpolation?: 'linear' | 'cubic' | 'step';
}

export interface StratifiedParameter extends BaseParameter {
  parameterType: 'stratified';
  // Stratification dimensions
  dimensions: string[];
  // Values for each dimension
  stratification: Record<string, string[]>;
  // Value for each combination
  values: Record<string, number>; // Encoded stratification key -> value
  // Optional aggregation functions
  aggregationFunctions?: {
    [key: string]: (values: number[]) => number;
  };
}

// Union type for any kind of parameter
export type ModelParameter = 
  | DeterministicParameter 
  | StochasticParameter 
  | TimeSeriesParameter 
  | StratifiedParameter;

export interface OutcomeMetric extends BaseParameter {
  type: 'outcome';
  // Core calculation
  calculate: (modelParameters: Record<string, ModelParameter>) => number;
  generateCalculationExplanation: (modelParameters: Record<string, ModelParameter>) => string;
  modelParameters: ModelParameter[];
  
  // Analysis methods
  sensitivity?: {
    type: 'local' | 'global' | 'sobol';
    calculate: (modelParameters: Record<string, ModelParameter>) => SensitivityAnalysis;
  };
  uncertainty?: {
    type: 'monte_carlo' | 'bootstrap' | 'interval';
    calculate: (modelParameters: Record<string, ModelParameter>) => UncertaintyAnalysis;
  };
  timeSeries?: {
    resolution: string;
    calculate: (modelParameters: Record<string, ModelParameter>) => TimeSeriesResult;
  };
  stratification?: {
    dimensions: string[];
    calculate: (modelParameters: Record<string, ModelParameter>, strata: string[]) => StratificationResult;
  };
}

export interface SensitivityAnalysis {
  method: string;
  results: Record<string, {
    value: number;
    impact: number;
    rank?: number;
  }>;
  visualizations?: Record<string, unknown>;
}

export interface UncertaintyAnalysis {
  method: string;
  summary: {
    mean: number;
    median?: number;
    standardDeviation: number;
    confidenceInterval: [number, number];
    percentiles?: Record<number, number>;
  };
  distribution?: {
    type: string;
    parameters: Record<string, number>;
  };
  samples?: number[];
}

export interface TimeSeriesResult {
  timePoints: number[];
  values: number[];
  metadata?: {
    seasonalComponents?: number[];
    trendComponent?: number[];
    residuals?: number[];
    fitMetrics?: Record<string, number>;
  };
}

export interface StratificationResult {
  overall: number;
  strata: Record<string, {
    value: number;
    sampleSize?: number;
    uncertainty?: {
      standardError?: number;
      confidenceInterval?: [number, number];
    };
  }>;
  decomposition?: {
    betweenGroupVariance: number;
    withinGroupVariance: number;
    explainedVariance: number;
  };
}

export interface Model {
  // Core properties
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly version: string;
  readonly metadata?: {
    authors?: string[];
    lastUpdated?: string;
    references?: Array<{
      citation: string;
      doi?: string;
      url?: string;
    }>;
    assumptions?: string[];
    limitations?: string[];
    validationStatus?: {
      status: 'draft' | 'peer-reviewed' | 'validated';
      validatedBy?: string[];
      validationDate?: string;
      validationMethod?: string;
    };
  };

  // Parameters and metrics
  readonly parameters: ModelParameter[];
  readonly metrics: OutcomeMetric[];

  // Core methods
  getMetric(id: string): OutcomeMetric | undefined;
  getParameter(id: string): ModelParameter | undefined;
  setParameterValue(id: string, value: number): void;
  calculateMetric(id: string): number;

  // Analysis methods
  calculateSensitivity(metricId: string): SensitivityAnalysis | undefined;
  calculateUncertainty(metricId: string): UncertaintyAnalysis | undefined;
  calculateTimeSeries(metricId: string): TimeSeriesResult | undefined;
  calculateBySubgroup(metricId: string, strata: string[]): StratificationResult | undefined;

  // Report generation
  generateMarkdownReport(): string;
}
