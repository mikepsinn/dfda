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

export interface ModelMetadata {
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
}

export interface OutcomeMetric extends BaseParameter {
  type: 'outcome';
  // Core calculation
  calculate: (modelParameters: Record<string, ModelParameter>) => number;
  generateCalculationExplanation: (modelParameters: Record<string, ModelParameter>) => string;
  modelParameters: Record<string, ModelParameter>;
  
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

export interface ModelConfig {
  id: string;
  title: string;
  description: string;
  version: string;
  parameters: ModelParameter[];
  metrics: OutcomeMetric[];
  metadata?: ModelMetadata;
}

export class BaseModel {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly version: string;
  readonly parameters: ModelParameter[];
  readonly metrics: OutcomeMetric[];
  readonly metadata?: ModelMetadata;

  constructor(config: {
    id: string;
    title: string;
    description: string;
    version: string;
    parameters: ModelParameter[];
    metrics: OutcomeMetric[];
    metadata?: ModelMetadata;
  }) {
    this.id = config.id;
    this.title = config.title;
    this.description = config.description;
    this.version = config.version;
    this.parameters = config.parameters;
    this.metrics = config.metrics;
    this.metadata = config.metadata;
  }

  getMetric(id: string): OutcomeMetric | undefined {
    return this.metrics.find(m => m.id === id);
  }

  getParameter(id: string): ModelParameter | undefined {
    return this.parameters.find(p => p.id === id);
  }

  setParameterValue(id: string, value: number): void {
    const param = this.getParameter(id);
    if (param) {
      if (param.parameterType === 'deterministic') {
        param.defaultValue = value;
      }
    }
  }

  calculateMetric(id: string): number {
    const metric = this.getMetric(id);
    if (!metric) {
      throw new Error(`Metric ${id} not found`);
    }
    return metric.calculate(this.getParametersAsRecord());
  }

  calculateSensitivity(metricId: string): SensitivityAnalysis | undefined {
    const metric = this.getMetric(metricId);
    if (!metric || !metric.sensitivity) {
      return undefined;
    }
    return metric.sensitivity.calculate(this.getParametersAsRecord());
  }

  calculateTimeSeries(metricId: string): TimeSeriesResult | undefined {
    const metric = this.getMetric(metricId);
    if (!metric || !metric.timeSeries) {
      return undefined;
    }
    return metric.timeSeries.calculate(this.getParametersAsRecord());
  }

  protected getParametersAsRecord(): Record<string, ModelParameter> {
    return this.parameters.reduce((acc, param) => {
      acc[param.id] = param;
      return acc;
    }, {} as Record<string, ModelParameter>);
  }

  generateMarkdownReport(): string {
    const parametersRecord = this.getParametersAsRecord();
    
    const report = [
      `# ${this.title}`,
      '',
      `## Description`,
      this.description,
      '',
      `## Version`,
      this.version,
      '',
      `## Parameters`,
      ...this.parameters.map((p: ModelParameter) => [
        `### ${p.displayName}`,
        `- Description: ${p.description}`,
        `- Default Value: ${p.defaultValue} ${p.unitName}`,
        `- Source: ${p.sourceUrl}`,
        p.sourceQuote ? `- Quote: "${p.sourceQuote}"` : '',
        ''
      ].filter(Boolean).join('\n')),
      '',
      `## Metrics`,
      ...this.metrics.map((m: OutcomeMetric) => [
        `### ${m.displayName}`,
        `- Description: ${m.description}`,
        `- Unit: ${m.unitName}`,
        `- Calculation: ${m.generateCalculationExplanation(parametersRecord)}`,
        ''
      ].join('\n')),
      '',
      `## Metadata`,
      ...(this.metadata?.authors ? [`### Authors`, ...this.metadata.authors.map((a: string) => `- ${a}`), ''] : []),
      ...(this.metadata?.assumptions ? [`### Assumptions`, ...this.metadata.assumptions.map((a: string) => `- ${a}`), ''] : []),
      ...(this.metadata?.limitations ? [`### Limitations`, ...this.metadata.limitations.map((l: string) => `- ${l}`), ''] : []),
      '',
      `Generated on: ${new Date().toISOString()}`
    ].join('\n');

    return report;
  }
}
