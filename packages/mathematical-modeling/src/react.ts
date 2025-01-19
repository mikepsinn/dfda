import { useState } from 'react';
import { BaseModel } from './models/base/BaseModel';

export interface ModelHookResult {
  parameters: Record<string, number>;
  setParameters: (params: Record<string, number>) => void;
  results: Record<string, number>;
  isValid: boolean;
}

export function useModel(model: BaseModel): ModelHookResult {
  // Initialize parameters from model with proper type assertion
  const initialParams = model.parameters.reduce<Record<string, number>>((acc, param) => {
    acc[param.id] = param.value;
    return acc;
  }, {});

  const [parameters, setParameters] = useState<Record<string, number>>(initialParams);
  const [isValid, setIsValid] = useState(true);

  // Update parameters and validate
  const updateParameters = (newParams: Record<string, number>): void => {
    setParameters(newParams);
    setIsValid(model.parameters.every(param => param.validate(newParams[param.id])));
  };

  // Calculate results with proper type assertion
  const results = model.metrics.reduce<Record<string, number>>((acc, metric) => {
    acc[metric.id] = metric.calculate();
    return acc;
  }, {});

  return {
    parameters,
    setParameters: updateParameters,
    results,
    isValid
  };
}
