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

export interface ModelReport {
  title: string;
  description: string;
  version: string;
  metadata?: {
    authors?: string[];
    lastUpdated?: string;
    validationStatus?: string;
  };
  parameters: {
    id: string;
    displayName: string;
    description: string;
    type: string;
    defaultValue: string;
    unit: string;
    source?: string;
  }[];
  outcomes: {
    id: string;
    displayName: string;
    description: string;
    unit: string;
    value: string;
    explanation: string;
    analysis?: {
      sensitivity?: SensitivityAnalysis;
      uncertainty?: UncertaintyAnalysis;
      timeSeries?: TimeSeriesResult;
    };
  }[];
  assumptions?: string[];
  limitations?: string[];
  references?: Array<{
    citation: string;
    doi?: string;
    url?: string;
  }>;
}

export interface ModelConfig {
  id: string;
  title: string;
  description: string;
  parameters: ModelParameter[];
  metrics: OutcomeMetric[];
  version: string;
  metadata?: {
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
  // Model-specific configuration
  settings?: Record<string, unknown>;
  // Computational requirements/constraints
  requirements?: {
    computeIntensive?: boolean;
    parallelizable?: boolean;
    memoryRequirements?: string;
    expectedRuntime?: string;
  };
  generateMarkdownReport?: (results: Record<string, number>) => string;
}

export type ModelConfiguration = ModelConfig;
