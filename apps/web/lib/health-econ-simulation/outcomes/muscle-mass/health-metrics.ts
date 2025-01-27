import { muscleMassParameters } from '../muscle-mass-parameters';
import { populationHealthMetrics } from '../../population-health-metrics';
import { OutcomeMetric, formatLargeNumber, validateMuscleMass } from './utils';

export const healthOutcomeMetrics: Record<string, OutcomeMetric> = {
    insulin_sensitivity_improvement: {
        displayName: "Insulin Sensitivity Improvement",
        defaultValue: 0,
        unitName: "percent",
        description: "Improvement in insulin sensitivity based on increased muscle mass",
        sourceUrl: muscleMassParameters.insulin_sensitivity_per_lb.sourceUrl,
        emoji: "💉",
        modelParameters: [muscleMassParameters.insulin_sensitivity_per_lb],
        calculate: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Insulin Sensitivity');
            return Math.min(0.20, muscleMassIncreasePerPerson * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue);
        },
        generateDisplayValue: (value) => `${(value * 100).toFixed(1)}%`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Insulin Sensitivity Explanation');
            return `
            <div class="calculation-explanation">
                <p>Each pound of muscle mass increases insulin sensitivity by ${muscleMassParameters.insulin_sensitivity_per_lb.defaultValue * 100}%:</p>
                <div class="formula">
                    ${muscleMassIncreasePerPerson} lbs × ${muscleMassParameters.insulin_sensitivity_per_lb.defaultValue * 100}% = ${(muscleMassIncreasePerPerson * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue * 100).toFixed(1)}%
                </div>
            </div>`;
        },
        calculateSensitivity: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Insulin Sensitivity Sensitivity');
            const baseValue = Math.min(0.20, muscleMassIncreasePerPerson * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue);
            return {
                bestCase: baseValue * 1.25,
                worstCase: baseValue * 0.75,
                assumptions: [
                    'Variation of ±25% based on clinical studies',
                    'Maximum improvement capped at 20%',
                    'Individual response variation considered'
                ]
            };
        }
    },
    fall_risk_reduction: {
        displayName: "Fall Risk Reduction",
        defaultValue: 0,
        unitName: "percent",
        description: "Reduction in fall risk based on increased muscle mass and strength",
        sourceUrl: muscleMassParameters.fall_risk_reduction_per_lb.sourceUrl,
        emoji: "🚶",
        modelParameters: [muscleMassParameters.fall_risk_reduction_per_lb],
        calculate: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Fall Risk Reduction');
            return Math.min(0.30, muscleMassIncreasePerPerson * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue);
        },
        generateDisplayValue: (value) => `${(value * 100).toFixed(1)}%`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Fall Risk Reduction Explanation');
            return `
            <div class="calculation-explanation">
                <p>Each pound of muscle reduces fall risk by ${muscleMassParameters.fall_risk_reduction_per_lb.defaultValue * 100}%, capped at 30% total reduction:</p>
                <div class="formula">
                    min(30%, ${muscleMassIncreasePerPerson} lbs × ${muscleMassParameters.fall_risk_reduction_per_lb.defaultValue * 100}%) = ${(Math.min(0.30, muscleMassIncreasePerPerson * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue) * 100).toFixed(1)}%
                </div>
            </div>`;
        },
        calculateSensitivity: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Fall Risk Reduction Sensitivity');
            const baseValue = Math.min(0.30, muscleMassIncreasePerPerson * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue);
            return {
                bestCase: baseValue * 1.25,
                worstCase: baseValue * 0.75,
                assumptions: [
                    'Variation of ±25% based on meta-analysis',
                    'Maximum reduction capped at 30%',
                    'Age and baseline fitness level impact considered'
                ]
            };
        }
    },
    mortality_risk_reduction: {
        displayName: "Mortality Risk Reduction",
        defaultValue: 0,
        unitName: "percent",
        description: "Reduction in mortality risk based on increased muscle mass",
        sourceUrl: muscleMassParameters.mortality_reduction_per_lb.sourceUrl,
        emoji: "❤️",
        modelParameters: [muscleMassParameters.mortality_reduction_per_lb],
        calculate: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Mortality Risk Reduction');
            return Math.min(0.20, muscleMassIncreasePerPerson * muscleMassParameters.mortality_reduction_per_lb.defaultValue);
        },
        generateDisplayValue: (value) => `${(value * 100).toFixed(1)}%`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Mortality Risk Reduction Explanation');
            return `
            <div class="calculation-explanation">
                <p>Each pound of muscle reduces mortality risk by ${muscleMassParameters.mortality_reduction_per_lb.defaultValue * 100}%, capped at 20% total reduction:</p>
                <div class="formula">
                    min(20%, ${muscleMassIncreasePerPerson} lbs × ${muscleMassParameters.mortality_reduction_per_lb.defaultValue * 100}%) = ${(Math.min(0.20, muscleMassIncreasePerPerson * muscleMassParameters.mortality_reduction_per_lb.defaultValue) * 100).toFixed(1)}%
                </div>
            </div>`;
        },
        calculateSensitivity: (muscleMassIncreasePerPerson) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Mortality Risk Reduction Sensitivity');
            const baseValue = Math.min(0.20, muscleMassIncreasePerPerson * muscleMassParameters.mortality_reduction_per_lb.defaultValue);
            return {
                bestCase: baseValue * 1.25,
                worstCase: baseValue * 0.75,
                assumptions: [
                    'Variation of ±25% based on systematic review',
                    'Maximum reduction capped at 20%',
                    'Age and comorbidity impact considered'
                ]
            };
        }
    }
}; 