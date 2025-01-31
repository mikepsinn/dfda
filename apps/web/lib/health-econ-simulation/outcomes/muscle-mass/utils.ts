import { ModelParameter } from '../../types';

// Utility function to validate muscle mass input
export function validateMuscleMass(muscleMassIncreasePerPerson: number, context: string = ''): void {
    if (typeof muscleMassIncreasePerPerson !== 'number') {
        throw new Error(`${context ? context + ': ' : ''}Muscle mass increase must be a number`);
    }
    if (muscleMassIncreasePerPerson > 100) {
        throw new Error(`${context ? context + ': ' : ''}Muscle mass increase per person should be in pounds, not total population pounds`);
    }
    if (muscleMassIncreasePerPerson < 0) {
        throw new Error(`${context ? context + ': ' : ''}Muscle mass increase cannot be negative`);
    }
}

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
    calculate: (muscleMassIncreasePerPerson: number, baselineMetrics?: any) => number;
    generateCalculationExplanation: (muscleMassIncreasePerPerson: number, baselineMetrics?: any) => string;
    calculateSensitivity: (muscleMassIncreasePerPerson: number, baselineMetrics?: any) => SensitivityAnalysis;
    generateDisplayValue: (value: number) => string;
    modelParameters: ModelParameter[];
}

// Helper function for sensitivity calculations
export const calculateVariation = (baseValue: number, variationPercent: number = 20): SensitivityAnalysis => ({
    bestCase: baseValue * (1 + variationPercent/100),
    worstCase: baseValue * (1 - variationPercent/100),
    assumptions: [`Variation of ±${variationPercent}% based on meta-analysis confidence intervals`]
}); 