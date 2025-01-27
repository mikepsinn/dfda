import { ModelParameter } from '../../types';

// Utility function to format large numbers with appropriate suffixes
export function formatLargeNumber(value: number): string {
    const absValue = Math.abs(value);
    if (absValue >= 1e9) {
        return (value / 1e9).toFixed(1) + 'B';
    } else if (absValue >= 1e6) {
        return (value / 1e6).toFixed(1) + 'M';
    } else if (absValue >= 1e3) {
        return (value / 1e3).toFixed(1) + 'K';
    }
    return value.toFixed(1);
}

// Utility function to format currency
export function formatCurrency(value: number): string {
    const formatted = formatLargeNumber(value);
    return '$' + formatted;
}

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

// Helper function for sensitivity calculations
export const calculateVariation = (baseValue: number, variationPercent: number = 20): SensitivityAnalysis => ({
    bestCase: baseValue * (1 + variationPercent/100),
    worstCase: baseValue * (1 - variationPercent/100),
    assumptions: [`Variation of ±${variationPercent}% based on meta-analysis confidence intervals`]
}); 