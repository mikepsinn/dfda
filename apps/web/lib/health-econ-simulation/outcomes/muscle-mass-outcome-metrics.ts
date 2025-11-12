import { ModelParameter } from '../types';

export interface SensitivityAnalysis {
    bestCase: number;
    worstCase: number;
    assumptions: string[];
}

export interface OutcomeMetric extends ModelParameter {
    calculate: (muscleMassIncrease: number, baselineMetrics?: any) => number;
    generateCalculationExplanation: (muscleMassIncrease: number, baselineMetrics?: any) => string;
    calculateSensitivity: (muscleMassIncrease: number, baselineMetrics?: any) => SensitivityAnalysis;
    generateDisplayValue: (value: number) => string;
    modelParameters: ModelParameter[];
}



