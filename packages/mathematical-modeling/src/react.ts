import { useEffect, useState, useCallback } from 'react';
import { Model } from './model';

export function useModel(model: Model) {
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, number>>({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Initialize parameters with default values
    const initialParams = model.metrics.reduce((acc, metric) => {
      metric.modelParameters.forEach(param => {
        acc[param.id] = param.defaultValue;
      });
      return acc;
    }, {} as Record<string, number>);
    
    setParameters(initialParams);
    setIsValid(model.validateParameters(initialParams));
  }, [model]);

  const updateParameter = useCallback((id: string, value: number) => {
    setParameters(prev => {
      const newParams = {...prev, [id]: value};
      setIsValid(model.validateParameters(newParams));
      return newParams;
    });
  }, [model]);

  const calculate = useCallback(() => {
    if (!isValid) return;
    
    const newResults = model.metrics.reduce((acc, metric) => {
      acc[metric.id] = metric.calculate(parameters);
      return acc;
    }, {} as Record<string, number>);
    
    setResults(newResults);
  }, [model, parameters, isValid]);

  return {
    parameters,
    results,
    isValid,
    updateParameter,
    calculate,
    reset: () => {
      setParameters({});
      setResults({});
      setIsValid(false);
    }
  };
}
