import { muscleMassParameters } from '../muscle-mass-parameters';
import { populationHealthMetrics } from '../../population-health-metrics';
import { OutcomeMetric } from './utils';

export const healthOutcomeMetrics: Record<string, OutcomeMetric> = {
    insulin_sensitivity_improvement: {
        displayName: "Insulin Sensitivity Improvement",
        defaultValue: 0,
        unitName: "relative improvement per person",
        description: "Improvement in insulin sensitivity per person due to increased muscle mass",
        sourceUrl: muscleMassParameters.insulin_sensitivity_per_lb.sourceUrl,
        emoji: "📊",
        modelParameters: [muscleMassParameters.insulin_sensitivity_per_lb, populationHealthMetrics.insulin_sensitivity],
        calculate: (muscleMassIncrease) => 
            muscleMassIncrease * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue,
        generateDisplayValue: (value) => `${(value * 100).toFixed(1)}% per person`,
        generateCalculationExplanation: (muscleMassIncrease) => `
            <div class="calculation-explanation">
                <p>Each pound of muscle mass increases insulin sensitivity by ${(muscleMassParameters.insulin_sensitivity_per_lb.defaultValue * 100)}%:</p>
                <div class="formula">
                    ${muscleMassIncrease} lbs × ${(muscleMassParameters.insulin_sensitivity_per_lb.defaultValue * 100)}% = ${(muscleMassIncrease * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue * 100).toFixed(1)}%
                </div>
            </div>`,
        calculateSensitivity: (muscleMassIncrease) => {
            const baseValue = muscleMassIncrease * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue;
            return {
                bestCase: muscleMassIncrease * 0.03,
                worstCase: muscleMassIncrease * 0.01,
                assumptions: [
                    'Upper bound: 3% improvement per pound',
                    'Lower bound: 1% improvement per pound',
                    'Based on clinical trial variations'
                ]
            };
        }
    },
    fall_risk_reduction: {
        displayName: "Fall Risk Reduction",
        defaultValue: 0,
        unitName: "probability reduction per person",
        description: "Reduction in probability of falls per person due to increased muscle mass",
        sourceUrl: muscleMassParameters.fall_risk_reduction_per_lb.sourceUrl,
        emoji: "🛡️",
        modelParameters: [muscleMassParameters.fall_risk_reduction_per_lb, populationHealthMetrics.fall_risk],
        calculate: (muscleMassIncrease) => 
            Math.min(0.30, muscleMassIncrease * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue),
        generateDisplayValue: (value) => `${(value * 100).toFixed(1)}% per person`,
        generateCalculationExplanation: (muscleMassIncrease) => `
            <div class="calculation-explanation">
                <p>Each pound of muscle reduces fall risk by ${(muscleMassParameters.fall_risk_reduction_per_lb.defaultValue * 100)}%, capped at 30% total reduction:</p>
                <div class="formula">
                    min(30%, ${muscleMassIncrease} lbs × ${(muscleMassParameters.fall_risk_reduction_per_lb.defaultValue * 100)}%) = ${(Math.min(0.30, muscleMassIncrease * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue) * 100).toFixed(1)}%
                </div>
            </div>`,
        calculateSensitivity: (muscleMassIncrease) => {
            const baseValue = Math.min(0.30, muscleMassIncrease * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue);
            return {
                bestCase: Math.min(0.35, muscleMassIncrease * 0.02),
                worstCase: Math.min(0.25, muscleMassIncrease * 0.01),
                assumptions: [
                    'Upper cap increased to 35% for best case',
                    'Lower cap reduced to 25% for worst case',
                    'Rate variation based on study population characteristics'
                ]
            };
        }
    },
    mortality_reduction: {
        displayName: "Mortality Risk Reduction",
        defaultValue: 0,
        unitName: "probability reduction per person",
        description: "Reduction in mortality risk per person due to increased muscle mass",
        sourceUrl: muscleMassParameters.mortality_reduction_per_lb.sourceUrl,
        emoji: "❤️",
        modelParameters: [muscleMassParameters.mortality_reduction_per_lb, populationHealthMetrics.mortality_risk],
        calculate: (muscleMassIncrease) => 
            Math.min(0.20, muscleMassIncrease * muscleMassParameters.mortality_reduction_per_lb.defaultValue),
        generateDisplayValue: (value) => `${(value * 100).toFixed(1)}% per person`,
        generateCalculationExplanation: (muscleMassIncrease) => `
            <div class="calculation-explanation">
                <p>Each pound of muscle reduces mortality risk by ${(muscleMassParameters.mortality_reduction_per_lb.defaultValue * 100)}%, capped at 20% total reduction:</p>
                <div class="formula">
                    min(20%, ${muscleMassIncrease} lbs × ${(muscleMassParameters.mortality_reduction_per_lb.defaultValue * 100)}%) = ${(Math.min(0.20, muscleMassIncrease * muscleMassParameters.mortality_reduction_per_lb.defaultValue) * 100).toFixed(1)}%
                </div>
            </div>`,
        calculateSensitivity: (muscleMassIncrease) => {
            const baseValue = Math.min(0.20, muscleMassIncrease * muscleMassParameters.mortality_reduction_per_lb.defaultValue);
            return {
                bestCase: Math.min(0.25, muscleMassIncrease * 0.015),
                worstCase: Math.min(0.15, muscleMassIncrease * 0.005),
                assumptions: [
                    'Upper cap increased to 25% for best case',
                    'Lower cap reduced to 15% for worst case',
                    'Based on demographic and health status variations'
                ]
            };
        }
    }
}; 