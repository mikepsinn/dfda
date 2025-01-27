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
            const baseEffect = muscleMassIncreasePerPerson * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue;
            return baseEffect / (1 + baseEffect);
        },
        generateDisplayValue: (value) => `${(value * 100).toFixed(1)}%`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Insulin Sensitivity Explanation');
            const baselineDiabetesRisk = populationHealthMetrics.diabetes_risk.defaultValue;
            const populationSize = baselineMetrics?.population_size || 0;
            const atRiskPopulation = Math.round(populationSize * baselineDiabetesRisk);
            const baseEffect = muscleMassIncreasePerPerson * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue;
            const actualImprovement = (baseEffect / (1 + baseEffect)) * 100;
            
            return `
            <div class="calculation-explanation">
                <p>Each pound of muscle mass increases insulin sensitivity with diminishing returns:</p>
                <ul>
                    <li>Baseline diabetes risk: ${(baselineDiabetesRisk * 100).toFixed(1)}% of population (${formatLargeNumber(atRiskPopulation)} people)</li>
                    <li>Base improvement rate: ${muscleMassParameters.insulin_sensitivity_per_lb.defaultValue * 100}% per pound</li>
                    <li>Actual improvement with diminishing returns: ${actualImprovement.toFixed(1)}%</li>
                </ul>
                <div class="formula">
                    Improvement = (base effect) / (1 + base effect) = ${actualImprovement.toFixed(1)}%
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
            const baseEffect = muscleMassIncreasePerPerson * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue;
            return baseEffect / (1 + baseEffect);
        },
        generateDisplayValue: (value) => `${(value * 100).toFixed(1)}%`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Fall Risk Reduction Explanation');
            const baselineFallRisk = populationHealthMetrics.fall_risk.defaultValue;
            const populationSize = baselineMetrics?.population_size || 0;
            const atRiskPopulation = Math.round(populationSize * baselineFallRisk);
            const baseEffect = muscleMassIncreasePerPerson * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue;
            const actualReduction = (baseEffect / (1 + baseEffect)) * 100;
            
            return `
            <div class="calculation-explanation">
                <p>Each pound of muscle reduces fall risk with diminishing returns:</p>
                <ul>
                    <li>Baseline fall risk: ${(baselineFallRisk * 100).toFixed(1)}% of population (${formatLargeNumber(atRiskPopulation)} people)</li>
                    <li>Base reduction rate: ${muscleMassParameters.fall_risk_reduction_per_lb.defaultValue * 100}% per pound</li>
                    <li>Actual reduction with diminishing returns: ${actualReduction.toFixed(1)}%</li>
                </ul>
                <div class="formula">
                    Reduction = (base effect) / (1 + base effect) = ${actualReduction.toFixed(1)}%
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
            const baseEffect = muscleMassIncreasePerPerson * muscleMassParameters.mortality_reduction_per_lb.defaultValue;
            return baseEffect / (1 + baseEffect);
        },
        generateDisplayValue: (value) => `${(value * 100).toFixed(1)}%`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Mortality Risk Reduction Explanation');
            const baselineMortalityRisk = populationHealthMetrics.mortality_risk.defaultValue;
            const populationSize = baselineMetrics?.population_size || 0;
            const atRiskPopulation = Math.round(populationSize * baselineMortalityRisk);
            const baseEffect = muscleMassIncreasePerPerson * muscleMassParameters.mortality_reduction_per_lb.defaultValue;
            const actualReduction = (baseEffect / (1 + baseEffect)) * 100;
            
            return `
            <div class="calculation-explanation">
                <p>Each pound of muscle reduces mortality risk with diminishing returns:</p>
                <ul>
                    <li>Baseline mortality risk: ${(baselineMortalityRisk * 100).toFixed(1)}% of population (${formatLargeNumber(atRiskPopulation)} people)</li>
                    <li>Base reduction rate: ${muscleMassParameters.mortality_reduction_per_lb.defaultValue * 100}% per pound</li>
                    <li>Actual reduction with diminishing returns: ${actualReduction.toFixed(1)}%</li>
                </ul>
                <div class="formula">
                    Reduction = (base effect) / (1 + base effect) = ${actualReduction.toFixed(1)}%
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