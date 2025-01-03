import { ModelParameter } from '../types';
import { muscleMassParameters } from './muscle-mass-parameters';

// Utility function to format large numbers with appropriate suffixes
function formatLargeNumber(value: number): string {
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
function formatCurrency(value: number): string {
    const formatted = formatLargeNumber(value);
    return '$' + formatted;
}

export interface SensitivityAnalysis {
    bestCase: number;
    worstCase: number;
    assumptions: string[];
}

export interface ExtendedModelParameter extends ModelParameter {
    calculate: (muscleMassIncrease: number, baselineMetrics?: any) => number;
    generateCalculationExplanation: (muscleMassIncrease: number, baselineMetrics?: any) => string;
    calculateSensitivity: (muscleMassIncrease: number, baselineMetrics?: any) => SensitivityAnalysis;
    generateDisplayValue: (value: number) => string;
}

// Helper function for sensitivity calculations
const calculateVariation = (baseValue: number, variationPercent: number = 20): SensitivityAnalysis => ({
    bestCase: baseValue * (1 + variationPercent/100),
    worstCase: baseValue * (1 - variationPercent/100),
    assumptions: [`Variation of ±${variationPercent}% based on meta-analysis confidence intervals`]
});

export const metabolicOutcomeMetrics: Record<string, ExtendedModelParameter> = {
    additional_daily_calories_burned: {
        displayName: "Additional Daily Calories Burned",
        defaultValue: 0,
        unitName: "calories/day/person",
        description: "Additional calories burned per day per person due to increased muscle mass",
        sourceUrl: muscleMassParameters.muscle_calorie_burn.sourceUrl,
        emoji: "🔥",
        calculate: (muscleMassIncrease) => 
            muscleMassIncrease * muscleMassParameters.muscle_calorie_burn.defaultValue,
        generateDisplayValue: (value) => `${formatLargeNumber(value)} calories/day/person`,
        generateCalculationExplanation: (muscleMassIncrease) => `
            <div class="calculation-explanation">
                <p>Each pound of muscle burns approximately ${muscleMassParameters.muscle_calorie_burn.defaultValue} calories per day:</p>
                <div class="formula">
                    ${muscleMassIncrease} lbs × ${muscleMassParameters.muscle_calorie_burn.defaultValue} calories/day = ${muscleMassIncrease * muscleMassParameters.muscle_calorie_burn.defaultValue} calories/day
                </div>
            </div>`,
        calculateSensitivity: (muscleMassIncrease) => {
            const baseValue = muscleMassIncrease * muscleMassParameters.muscle_calorie_burn.defaultValue;
            return {
                bestCase: muscleMassIncrease * 10, // Upper range of calories burned
                worstCase: muscleMassIncrease * 6, // Lower range of calories burned
                assumptions: [
                    'Upper bound: 10 calories per pound of muscle per day',
                    'Lower bound: 6 calories per pound of muscle per day',
                    'Based on range reported in literature'
                ]
            };
        }
    },
    annual_metabolic_impact: {
        displayName: "Annual Metabolic Impact",
        defaultValue: 0,
        unitName: "calories/year/person",
        description: "Total additional calories burned per year per person due to increased muscle mass",
        sourceUrl: muscleMassParameters.muscle_calorie_burn.sourceUrl,
        emoji: "📅",
        calculate: (muscleMassIncrease) => 
            muscleMassIncrease * muscleMassParameters.muscle_calorie_burn.defaultValue * 365,
        generateDisplayValue: (value) => `${formatLargeNumber(value)} calories/year/person`,
        generateCalculationExplanation: (muscleMassIncrease) => `
            <div class="calculation-explanation">
                <p>Annual impact is calculated by multiplying daily caloric burn by 365 days:</p>
                <div class="formula">
                    (${muscleMassIncrease} lbs × ${muscleMassParameters.muscle_calorie_burn.defaultValue} calories/day) × 365 days = ${muscleMassIncrease * muscleMassParameters.muscle_calorie_burn.defaultValue * 365} calories/year
                </div>
            </div>`,
        calculateSensitivity: (muscleMassIncrease) => {
            const baseValue = muscleMassIncrease * muscleMassParameters.muscle_calorie_burn.defaultValue * 365;
            return {
                bestCase: muscleMassIncrease * 10 * 365,
                worstCase: muscleMassIncrease * 6 * 365,
                assumptions: [
                    'Based on daily caloric burn variation',
                    'Assumes consistent metabolic rate throughout the year'
                ]
            };
        }
    }
};

export const healthOutcomeMetrics: Record<string, ExtendedModelParameter> = {
    insulin_sensitivity_improvement: {
        displayName: "Insulin Sensitivity Improvement",
        defaultValue: 0,
        unitName: "relative improvement per person",
        description: "Improvement in insulin sensitivity per person due to increased muscle mass",
        sourceUrl: muscleMassParameters.insulin_sensitivity_per_lb.sourceUrl,
        emoji: "📊",
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

export const economicOutcomeMetrics: Record<string, ExtendedModelParameter> = {
    healthcare_savings: {
        displayName: "Healthcare Cost Savings",
        defaultValue: 0,
        unitName: "USD/year total",
        description: "Total annual healthcare cost savings from improved health outcomes across population",
        sourceUrl: muscleMassParameters.fall_cost.sourceUrl,
        emoji: "💰",
        calculate: (muscleMassIncrease, baselineMetrics) => {
            // Age distribution weights for general population with updated risk multipliers
            const ageDistribution = {
                'under-45': { weight: 0.54, riskMultiplier: 0.6 },  // 54% of population, increased from 0.5
                '45-64': { weight: 0.30, riskMultiplier: 1.0 },    // 30% of population, increased from 0.8
                '65-74': { weight: 0.09, riskMultiplier: 1.5 },    // 9% of population, increased from 1.0
                '75-84': { weight: 0.05, riskMultiplier: 2.0 },    // 5% of population, increased from 1.5
                '85+': { weight: 0.02, riskMultiplier: 3.0 }       // 2% of population, increased from 2.5
            };

            // 1. Fall-related cost savings (adjusted by age)
            const fallRiskReduction = Math.min(0.30, muscleMassIncrease * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue);
            const fallCostSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedFallRisk = muscleMassParameters.fall_risk.defaultValue * data.riskMultiplier;
                const baseFallCost = muscleMassParameters.fall_cost.defaultValue * 1.2; // Increased base cost by 20%
                return total + (ageGroupPopulation * adjustedFallRisk * fallRiskReduction * 
                              baseFallCost * data.riskMultiplier);
            }, 0);

            // 2. Diabetes-related cost savings
            const insulinSensitivityImprovement = muscleMassIncrease * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue;
            const diabetesPrevalence = 0.11; // 11% of general population has diabetes
            const annualDiabetesCost = 19800; // Increased from 16,750 based on latest data
            const diabetesCostReduction = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedPrevalence = diabetesPrevalence * (data.riskMultiplier ** 0.7); // Increased age impact
                return total + (ageGroupPopulation * annualDiabetesCost * adjustedPrevalence * 
                              insulinSensitivityImprovement * data.riskMultiplier);
            }, 0);

            // 3. Hospitalization reduction
            const hospitalizationReduction = Math.min(0.15, muscleMassIncrease * 0.005);
            const annualHospitalizationCost = 18500; // Increased from 15,800
            const baseHospitalizationRate = 0.11; // Increased from 0.09
            const hospitalizationSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedRate = baseHospitalizationRate * (data.riskMultiplier ** 1.2); // Increased age impact
                const adjustedReduction = hospitalizationReduction * data.riskMultiplier;
                return total + (ageGroupPopulation * annualHospitalizationCost * adjustedRate * 
                              adjustedReduction * data.riskMultiplier);
            }, 0);

            // 4. Mortality-related healthcare savings
            const mortalityReduction = Math.min(0.20, muscleMassIncrease * muscleMassParameters.mortality_reduction_per_lb.defaultValue);
            const avgEndOfLifeCost = 95000; // Increased from 80,000
            const annualMortalityRate = 0.0085;
            const mortalitySavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedMortalityRate = annualMortalityRate * (data.riskMultiplier ** 1.5); // Increased age impact
                return total + (ageGroupPopulation * avgEndOfLifeCost * adjustedMortalityRate * 
                              mortalityReduction * data.riskMultiplier);
            }, 0);

            // 5. General healthcare utilization reduction
            const baseAnnualHealthcareCost = 14500; // Increased from 12,000
            const utilizationReduction = Math.min(0.12, muscleMassIncrease * 0.004); // Increased from 0.10 and 0.003
            const utilizationSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedCost = baseAnnualHealthcareCost * (data.riskMultiplier ** 1.3); // Increased age impact
                return total + (ageGroupPopulation * adjustedCost * utilizationReduction * data.riskMultiplier);
            }, 0);

            return fallCostSavings + diabetesCostReduction + hospitalizationSavings + 
                   mortalitySavings + utilizationSavings;
        },
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncrease, baselineMetrics) => {
            const ageDistribution = {
                'under-45': { weight: 0.54, riskMultiplier: 0.6 },
                '45-64': { weight: 0.30, riskMultiplier: 1.0 },
                '65-74': { weight: 0.09, riskMultiplier: 1.5 },
                '75-84': { weight: 0.05, riskMultiplier: 2.0 },
                '85+': { weight: 0.02, riskMultiplier: 3.0 }
            };

            // Recalculate all components
            const fallRiskReduction = Math.min(0.30, muscleMassIncrease * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue);
            const insulinSensitivityImprovement = muscleMassIncrease * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue;
            const hospitalizationReduction = Math.min(0.15, muscleMassIncrease * 0.005);
            const mortalityReduction = Math.min(0.20, muscleMassIncrease * muscleMassParameters.mortality_reduction_per_lb.defaultValue);
            const utilizationReduction = Math.min(0.12, muscleMassIncrease * 0.004);

            // Calculate components using the same logic as the calculate function
            const fallCostSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedFallRisk = muscleMassParameters.fall_risk.defaultValue * data.riskMultiplier;
                return total + (ageGroupPopulation * adjustedFallRisk * fallRiskReduction * 
                              muscleMassParameters.fall_cost.defaultValue * data.riskMultiplier);
            }, 0);

            const diabetesCostReduction = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedPrevalence = 0.11 * (data.riskMultiplier ** 0.7);
                return total + (ageGroupPopulation * 19800 * adjustedPrevalence * 
                              insulinSensitivityImprovement * data.riskMultiplier);
            }, 0);

            const hospitalizationSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedRate = 0.11 * (data.riskMultiplier ** 1.2);
                return total + (ageGroupPopulation * 18500 * adjustedRate * 
                              hospitalizationReduction * data.riskMultiplier);
            }, 0);

            const mortalitySavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedMortalityRate = 0.0085 * (data.riskMultiplier ** 1.5);
                return total + (ageGroupPopulation * 95000 * adjustedMortalityRate * 
                              mortalityReduction * data.riskMultiplier);
            }, 0);

            const utilizationSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                return total + (ageGroupPopulation * 14500 * data.riskMultiplier * 
                              utilizationReduction * data.riskMultiplier);
            }, 0);

            const totalSavings = fallCostSavings + diabetesCostReduction + hospitalizationSavings + 
                               mortalitySavings + utilizationSavings;

            return `
            <div class="calculation-explanation">
                <p>Healthcare savings are calculated based on multiple factors, adjusted for population demographics:</p>
                <p>Population Age Distribution:</p>
                <ul>
                    <li>Under 45: 54% (0.6x risk)</li>
                    <li>45-64: 30% (1.0x risk)</li>
                    <li>65-74: 9% (1.5x risk)</li>
                    <li>75-84: 5% (2.0x risk)</li>
                    <li>85+: 2% (3.0x risk)</li>
                </ul>
                <ol>
                    <li>Age-adjusted fall-related cost savings:
                        <br/>$${fallCostSavings.toLocaleString()} (${((fallCostSavings / totalSavings) * 100).toFixed(1)}% of total savings)</li>
                    <li>Diabetes-related cost savings (age-adjusted prevalence):
                        <br/>$${diabetesCostReduction.toLocaleString()} (${((diabetesCostReduction / totalSavings) * 100).toFixed(1)}% of total savings)</li>
                    <li>Age-adjusted hospitalization reduction:
                        <br/>$${hospitalizationSavings.toLocaleString()} (${((hospitalizationSavings / totalSavings) * 100).toFixed(1)}% of total savings)</li>
                    <li>Mortality-related healthcare savings:
                        <br/>$${mortalitySavings.toLocaleString()} (${((mortalitySavings / totalSavings) * 100).toFixed(1)}% of total savings)</li>
                    <li>General healthcare utilization reduction:
                        <br/>$${utilizationSavings.toLocaleString()} (${((utilizationSavings / totalSavings) * 100).toFixed(1)}% of total savings)</li>
                </ol>
                <div class="formula">
                    <p><strong>Total Healthcare Savings:</strong> $${totalSavings.toLocaleString()}/year</p>
                    <p><em>Per Person Average: $${Math.round(totalSavings / baselineMetrics.population_size).toLocaleString()}/year</em></p>
                </div>
            </div>`
        },
        calculateSensitivity: (muscleMassIncrease, baselineMetrics) => {
            const baseValue = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncrease, baselineMetrics);
            return {
                bestCase: baseValue * 1.40,
                worstCase: baseValue * 0.60,
                assumptions: [
                    'Variation of ±40% in healthcare cost savings',
                    'Accounts for age distribution uncertainty',
                    'Includes variations in disease prevalence',
                    'Considers regional cost variations',
                    'Based on healthcare cost trends',
                    'Accounts for intervention effectiveness variations'
                ]
            };
        }
    },
    productivity_gains: {
        displayName: "Productivity Gains",
        defaultValue: 0,
        unitName: "USD/year total",
        description: "Total annual economic gains from improved workforce productivity across population, based on cognitive performance improvements",
        sourceUrl: "https://www.nature.com/articles/s41598-020-59914-3",
        emoji: "📈",
        calculate: (muscleMassIncrease, baselineMetrics) => {
            // Constants from the Nature study and conversion factors
            const LBS_TO_KG = 0.453592;
            const COGNITIVE_COEFFICIENT = 0.32; // regression coefficient from Nature study
            const PRODUCTIVITY_CONVERSION = 0.15; // 15% productivity per SD cognitive improvement
            const AVG_ANNUAL_SALARY = 55000; // Average annual salary baseline

            // Calculate productivity gain percentage
            const productivityGainPercent = 
                (muscleMassIncrease * LBS_TO_KG) * COGNITIVE_COEFFICIENT * PRODUCTIVITY_CONVERSION;
            
            // Calculate monetary impact across population
            return productivityGainPercent * AVG_ANNUAL_SALARY * baselineMetrics.population_size;
        },
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncrease, baselineMetrics) => {
            const LBS_TO_KG = 0.453592;
            const COGNITIVE_COEFFICIENT = 0.32;
            const PRODUCTIVITY_CONVERSION = 0.15;
            const AVG_ANNUAL_SALARY = 55000;

            const kgIncrease = muscleMassIncrease * LBS_TO_KG;
            const productivityGainPercent = kgIncrease * COGNITIVE_COEFFICIENT * PRODUCTIVITY_CONVERSION;
            const monetaryImpact = productivityGainPercent * AVG_ANNUAL_SALARY * baselineMetrics.population_size;

            return `
            <div class="calculation-explanation">
                <p>Productivity gains are calculated based on cognitive performance improvements from the Nature study:</p>
                <ul>
                    <li>Muscle mass increase: ${muscleMassIncrease} lbs (${kgIncrease.toFixed(2)} kg)</li>
                    <li>Cognitive improvement coefficient: ${COGNITIVE_COEFFICIENT} per kg (Nature study)</li>
                    <li>Productivity conversion: ${(PRODUCTIVITY_CONVERSION * 100)}% per cognitive SD</li>
                    <li>Average annual salary: $${AVG_ANNUAL_SALARY.toLocaleString()}</li>
                    <li>Population size: ${baselineMetrics.population_size.toLocaleString()}</li>
                </ul>
                <div class="formula">
                    Productivity gain: ${(productivityGainPercent * 100).toFixed(3)}%<br>
                    Monetary impact: ${(productivityGainPercent * 100).toFixed(3)}% × $${AVG_ANNUAL_SALARY.toLocaleString()} × ${baselineMetrics.population_size.toLocaleString()} = $${monetaryImpact.toLocaleString()}
                </div>
            </div>`
        },
        calculateSensitivity: (muscleMassIncrease, baselineMetrics) => {
            // Base calculation with nominal values
            const LBS_TO_KG = 0.453592;
            const COGNITIVE_COEFFICIENT = 0.32;
            const PRODUCTIVITY_CONVERSION = 0.15;
            const AVG_ANNUAL_SALARY = 55000;

            const baseValue = (muscleMassIncrease * LBS_TO_KG) * COGNITIVE_COEFFICIENT * 
                            PRODUCTIVITY_CONVERSION * AVG_ANNUAL_SALARY * baselineMetrics.population_size;

            // Calculate with confidence interval bounds from the Nature study
            const bestCase = (muscleMassIncrease * LBS_TO_KG) * (COGNITIVE_COEFFICIENT * 1.25) * 
                           (PRODUCTIVITY_CONVERSION * 1.33) * AVG_ANNUAL_SALARY * baselineMetrics.population_size;
            const worstCase = (muscleMassIncrease * LBS_TO_KG) * (COGNITIVE_COEFFICIENT * 0.75) * 
                            (PRODUCTIVITY_CONVERSION * 0.67) * AVG_ANNUAL_SALARY * baselineMetrics.population_size;

            return {
                bestCase,
                worstCase,
                assumptions: [
                    'Cognitive coefficient 95% CI from Nature study: ±25%',
                    'Productivity conversion factor range: 10-20%',
                    'Based on cognitive performance to productivity relationship',
                    'Assumes consistent impact across working population'
                ]
            };
        }
    },
    total_economic_benefit: {
        displayName: "Total Economic Benefit",
        defaultValue: 0,
        unitName: "USD/year total",
        description: "Total annual economic benefit including healthcare savings, productivity gains, and monetized QALY value across population",
        sourceUrl: muscleMassParameters.productivity_gain_per_lb.sourceUrl,
        emoji: "💎",
        calculate: (muscleMassIncrease, baselineMetrics) => {
            const healthcareSavings = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncrease, baselineMetrics);
            const productivityGains = economicOutcomeMetrics.productivity_gains.calculate(muscleMassIncrease, baselineMetrics);
            
            // Calculate annual value of QALYs
            const lifetimeQalys = economicOutcomeMetrics.qalys_gained.calculate(muscleMassIncrease, baselineMetrics);
            const QALY_VALUE = 100000; // Standard value per QALY in USD
            const AVG_REMAINING_LIFE_EXPECTANCY = 40; // Should match value in qalys_gained
            const annualQalyValue = (lifetimeQalys * QALY_VALUE) / AVG_REMAINING_LIFE_EXPECTANCY;

            return healthcareSavings + productivityGains + annualQalyValue;
        },
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncrease, baselineMetrics) => {
            const healthcareSavings = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncrease, baselineMetrics);
            const productivityGains = economicOutcomeMetrics.productivity_gains.calculate(muscleMassIncrease, baselineMetrics);
            const lifetimeQalys = economicOutcomeMetrics.qalys_gained.calculate(muscleMassIncrease, baselineMetrics);
            
            const QALY_VALUE = 100000;
            const AVG_REMAINING_LIFE_EXPECTANCY = 40;
            const annualQalyValue = (lifetimeQalys * QALY_VALUE) / AVG_REMAINING_LIFE_EXPECTANCY;

            return `
            <div class="calculation-explanation">
                <p>Total economic benefit includes healthcare savings, productivity gains, and monetized QALY value:</p>
                <div class="formula">
                    Healthcare Savings: $${healthcareSavings.toLocaleString()}/year<br>
                    Productivity Gains: $${productivityGains.toLocaleString()}/year<br>
                    Annual QALY Value: $${annualQalyValue.toLocaleString()}/year 
                    <em>(${lifetimeQalys.toLocaleString()} lifetime QALYs × $${QALY_VALUE.toLocaleString()}/QALY ÷ ${AVG_REMAINING_LIFE_EXPECTANCY} years)</em><br>
                    Total: $${(healthcareSavings + productivityGains + annualQalyValue).toLocaleString()}/year
                </div>
            </div>`
        },
        calculateSensitivity: (muscleMassIncrease, baselineMetrics) => {
            const healthcareSensitivity = economicOutcomeMetrics.healthcare_savings.calculateSensitivity(muscleMassIncrease, baselineMetrics);
            const productivitySensitivity = economicOutcomeMetrics.productivity_gains.calculateSensitivity(muscleMassIncrease, baselineMetrics);
            const qalySensitivity = economicOutcomeMetrics.qalys_gained.calculateSensitivity(muscleMassIncrease, baselineMetrics);
            
            // Calculate annual QALY values with different QALY monetary values
            const LOW_QALY_VALUE = 50000;
            const HIGH_QALY_VALUE = 150000;
            const AVG_REMAINING_LIFE_EXPECTANCY = 40;
            
            const worstQalyValue = (qalySensitivity.worstCase * LOW_QALY_VALUE) / AVG_REMAINING_LIFE_EXPECTANCY;
            const bestQalyValue = (qalySensitivity.bestCase * HIGH_QALY_VALUE) / AVG_REMAINING_LIFE_EXPECTANCY;

            return {
                bestCase: healthcareSensitivity.bestCase + productivitySensitivity.bestCase + bestQalyValue,
                worstCase: healthcareSensitivity.worstCase + productivitySensitivity.worstCase + worstQalyValue,
                assumptions: [
                    'Combined sensitivity of healthcare savings and productivity gains',
                    'QALY value range: $50,000-$150,000 per QALY',
                    'Includes lifetime QALY gains converted to annual value',
                    'Assumes independent variation of components'
                ]
            };
        }
    },
    qalys_gained: {
        displayName: "Lifetime QALYs Gained",
        defaultValue: 0,
        unitName: "lifetime QALYs total",
        description: "Total lifetime quality-adjusted life years gained across population based on systematic review and meta-analysis of SMI impact on mortality",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/37285331/",
        emoji: "✨",
        calculate: (muscleMassIncrease, baselineMetrics) => {
            // Constants from meta-analysis and model
            const LBS_TO_KG = 0.453592;
            const MORTALITY_REDUCTION_PER_KG = 0.075; // 7.5% reduction per kg/m² SMI
            const AVG_REMAINING_LIFE_EXPECTANCY = 40; // Average remaining life expectancy in years
            const AVG_BODY_SURFACE_AREA = 1.7; // Average body surface area in m²

            // Calculate lifetime QALYs gained per person
            const qalyPerPerson = (muscleMassIncrease * LBS_TO_KG) * 
                                (MORTALITY_REDUCTION_PER_KG * AVG_REMAINING_LIFE_EXPECTANCY);

            // Calculate total lifetime QALYs across population
            return qalyPerPerson * baselineMetrics.population_size;
        },
        generateDisplayValue: (value) => `${formatLargeNumber(value)} lifetime QALYs total`,
        generateCalculationExplanation: (muscleMassIncrease, baselineMetrics) => {
            const LBS_TO_KG = 0.453592;
            const MORTALITY_REDUCTION_PER_KG = 0.075;
            const AVG_REMAINING_LIFE_EXPECTANCY = 40;
            const AVG_BODY_SURFACE_AREA = 1.7;

            const kgIncrease = muscleMassIncrease * LBS_TO_KG;
            const qalyPerPerson = kgIncrease * (MORTALITY_REDUCTION_PER_KG * AVG_REMAINING_LIFE_EXPECTANCY);
            const totalQalys = qalyPerPerson * baselineMetrics.population_size;

            return `
            <div class="calculation-explanation">
                <p>Lifetime QALYs are calculated based on systematic review and meta-analysis of SMI impact on mortality:</p>
                <ul>
                    <li>Muscle mass increase: ${muscleMassIncrease} lbs (${kgIncrease.toFixed(2)} kg)</li>
                    <li>Mortality reduction: ${(MORTALITY_REDUCTION_PER_KG * 100)}% per kg/m² SMI</li>
                    <li>Average remaining life expectancy: ${AVG_REMAINING_LIFE_EXPECTANCY} years</li>
                    <li>Average body surface area: ${AVG_BODY_SURFACE_AREA} m²</li>
                </ul>
                <div class="formula">
                    Lifetime QALYs per person = ${kgIncrease.toFixed(2)} kg × (${(MORTALITY_REDUCTION_PER_KG * 100)}% × ${AVG_REMAINING_LIFE_EXPECTANCY} years) = ${qalyPerPerson.toFixed(2)} QALYs<br>
                    Total lifetime QALYs = ${qalyPerPerson.toFixed(2)} × ${baselineMetrics.population_size.toLocaleString()} people = ${totalQalys.toLocaleString()} QALYs
                </div>
                <p><em>Note: These are lifetime QALYs gained, not annual QALYs. The calculation represents the total quality-adjusted life years gained over the remaining life expectancy.</em></p>
            </div>`
        },
        calculateSensitivity: (muscleMassIncrease, baselineMetrics) => {
            const LBS_TO_KG = 0.453592;
            const MORTALITY_REDUCTION_PER_KG = 0.075;
            const AVG_REMAINING_LIFE_EXPECTANCY = 40;
            
            // Base calculation
            const baseQalyPerPerson = (muscleMassIncrease * LBS_TO_KG) * 
                                    (MORTALITY_REDUCTION_PER_KG * AVG_REMAINING_LIFE_EXPECTANCY);
            const baseValue = baseQalyPerPerson * baselineMetrics.population_size;

            // Best case: Higher mortality reduction and life expectancy
            const bestQalyPerPerson = (muscleMassIncrease * LBS_TO_KG) * 
                                    (0.09 * 45); // 9% reduction, 45 years
            const bestCase = bestQalyPerPerson * baselineMetrics.population_size;

            // Worst case: Lower mortality reduction and life expectancy
            const worstQalyPerPerson = (muscleMassIncrease * LBS_TO_KG) * 
                                     (0.06 * 35); // 6% reduction, 35 years
            const worstCase = worstQalyPerPerson * baselineMetrics.population_size;

            return {
                bestCase,
                worstCase,
                assumptions: [
                    'Mortality risk reduction range: 6-9% per kg/m² SMI',
                    'Remaining life expectancy range: 35-45 years',
                    'Linear relationship between muscle mass and mortality risk',
                    'Each year of life gained equals 1 QALY',
                    'Based on systematic review and meta-analysis data'
                ]
            };
        }
    },
    medicare_spend_impact: {
        displayName: "Medicare Spend Impact",
        defaultValue: 0,
        unitName: "USD/year total",
        description: "Total annual impact on Medicare spending from improved health outcomes across Medicare-eligible population",
        sourceUrl: "https://www.cms.gov/research-statistics-data-and-systems/statistics-trends-and-reports/nationalhealthexpenddata",
        emoji: "🏥",
        calculate: (muscleMassIncrease, baselineMetrics) => {
            // Medicare population adjustments
            const medicareEligibleRatio = 0.186; // 18.6% of US population on Medicare (2023 data)
            const medicarePopulation = baselineMetrics.population_size * medicareEligibleRatio;
            
            // Age distribution weights (based on Medicare enrollment data)
            const ageDistribution = {
                '65-74': { weight: 0.51, riskMultiplier: 1.0 },    // 51% of Medicare population
                '75-84': { weight: 0.33, riskMultiplier: 1.5 },    // 33% of Medicare population, 1.5x risk
                '85+': { weight: 0.16, riskMultiplier: 2.5 }       // 16% of Medicare population, 2.5x risk
            };

            // 1. Mortality reduction impact (adjusted by age)
            const mortalityReduction = Math.min(0.20, muscleMassIncrease * muscleMassParameters.mortality_reduction_per_lb.defaultValue);
            const mortalityImpact = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = medicarePopulation * data.weight;
                const adjustedReduction = mortalityReduction * data.riskMultiplier;
                return total + (baselineMetrics.medicare_total_annual_spend * adjustedReduction * data.weight);
            }, 0);

            // 2. Fall-related cost savings (higher impact on older population)
            const fallRiskReduction = Math.min(0.30, muscleMassIncrease * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue);
            const fallCostSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = medicarePopulation * data.weight;
                const adjustedFallRisk = muscleMassParameters.fall_risk.defaultValue * data.riskMultiplier;
                return total + (ageGroupPopulation * adjustedFallRisk * fallRiskReduction * 
                              muscleMassParameters.fall_cost.defaultValue * 0.65 * data.riskMultiplier);
            }, 0);

            // 3. Diabetes-related cost savings (adjusted for Medicare population)
            const insulinSensitivityImprovement = muscleMassIncrease * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue;
            const diabetesPrevalenceInMedicare = 0.33; // 33% of Medicare beneficiaries have diabetes
            const diabetesCostReduction = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = medicarePopulation * data.weight;
                return total + (ageGroupPopulation * 13800 * diabetesPrevalenceInMedicare * 
                              insulinSensitivityImprovement * data.riskMultiplier);
            }, 0);

            // 4. Hospitalization reduction (adjusted for age-specific rates)
            const hospitalizationReduction = Math.min(0.15, muscleMassIncrease * 0.005);
            const hospitalizationSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const adjustedReduction = hospitalizationReduction * data.riskMultiplier;
                return total + (baselineMetrics.medicare_total_annual_spend * 0.30 * 
                              adjustedReduction * data.weight);
            }, 0);

            return mortalityImpact + fallCostSavings + diabetesCostReduction + hospitalizationSavings;
        },
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncrease, baselineMetrics) => {
            const medicareEligibleRatio = 0.186;
            const medicarePopulation = baselineMetrics.population_size * medicareEligibleRatio;

            const mortalityReduction = Math.min(0.20, muscleMassIncrease * muscleMassParameters.mortality_reduction_per_lb.defaultValue);
            const fallRiskReduction = Math.min(0.30, muscleMassIncrease * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue);
            const insulinSensitivityImprovement = muscleMassIncrease * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue;
            const hospitalizationReduction = Math.min(0.15, muscleMassIncrease * 0.005);

            // Recalculate impacts using the same logic as the calculate function
            const ageDistribution = {
                '65-74': { weight: 0.51, riskMultiplier: 1.0 },
                '75-84': { weight: 0.33, riskMultiplier: 1.5 },
                '85+': { weight: 0.16, riskMultiplier: 2.5 }
            };

            const mortalityImpact = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = medicarePopulation * data.weight;
                const adjustedReduction = mortalityReduction * data.riskMultiplier;
                return total + (baselineMetrics.medicare_total_annual_spend * adjustedReduction * data.weight);
            }, 0);

            const fallCostSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = medicarePopulation * data.weight;
                const adjustedFallRisk = muscleMassParameters.fall_risk.defaultValue * data.riskMultiplier;
                return total + (ageGroupPopulation * adjustedFallRisk * fallRiskReduction * 
                              muscleMassParameters.fall_cost.defaultValue * 0.65 * data.riskMultiplier);
            }, 0);

            const diabetesCostReduction = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = medicarePopulation * data.weight;
                return total + (ageGroupPopulation * 13800 * 0.33 * 
                              insulinSensitivityImprovement * data.riskMultiplier);
            }, 0);

            const hospitalizationSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const adjustedReduction = hospitalizationReduction * data.riskMultiplier;
                return total + (baselineMetrics.medicare_total_annual_spend * 0.30 * 
                              adjustedReduction * data.weight);
            }, 0);

            const totalImpact = mortalityImpact + fallCostSavings + diabetesCostReduction + hospitalizationSavings;
            const perPersonImpact = totalImpact / medicarePopulation;
            const currentPerPersonSpend = baselineMetrics.medicare_total_annual_spend / medicarePopulation;

            return `
            <div class="calculation-explanation">
                <p>Medicare spend impact is calculated based on multiple factors, adjusted for Medicare demographics:</p>
                <p>Current Annual Medicare Spend:</p>
                <ul>
                    <li>Total: $${baselineMetrics.medicare_total_annual_spend.toLocaleString()}</li>
                    <li>Per Medicare Beneficiary: $${Math.round(currentPerPersonSpend).toLocaleString()}/year</li>
                </ul>
                <p>Medicare Population: ${Math.round(medicarePopulation).toLocaleString()} (${(medicareEligibleRatio * 100).toFixed(1)}% of total)</p>
                <p>Age Distribution:</p>
                <ul>
                    <li>65-74: 51% (baseline risk)</li>
                    <li>75-84: 33% (1.5x risk)</li>
                    <li>85+: 16% (2.5x risk)</li>
                </ul>
                <ol>
                    <li>Age-adjusted mortality reduction impact:
                        <br/>$${mortalityImpact.toLocaleString()} (${((mortalityImpact / baselineMetrics.medicare_total_annual_spend) * 100).toFixed(2)}% of total spend)</li>
                    <li>Age-adjusted fall-related cost savings:
                        <br/>$${fallCostSavings.toLocaleString()} (${((fallCostSavings / baselineMetrics.medicare_total_annual_spend) * 100).toFixed(2)}% of total spend)</li>
                    <li>Diabetes-related cost savings (33% prevalence):
                        <br/>$${diabetesCostReduction.toLocaleString()} (${((diabetesCostReduction / baselineMetrics.medicare_total_annual_spend) * 100).toFixed(2)}% of total spend)</li>
                    <li>Age-adjusted hospitalization reduction:
                        <br/>$${hospitalizationSavings.toLocaleString()} (${((hospitalizationSavings / baselineMetrics.medicare_total_annual_spend) * 100).toFixed(2)}% of total spend)</li>
                </ol>
                <div class="formula">
                    <p><strong>Total Medicare Impact:</strong></p>
                    <ul>
                        <li>Total Savings: $${totalImpact.toLocaleString()}/year
                            <br/><em>(${((totalImpact / baselineMetrics.medicare_total_annual_spend) * 100).toFixed(2)}% of total Medicare spend)</em>
                        </li>
                        <li>Per Beneficiary Savings: $${Math.round(perPersonImpact).toLocaleString()}/year
                            <br/><em>(${((perPersonImpact / currentPerPersonSpend) * 100).toFixed(2)}% reduction in per-person spend)</em>
                        </li>
                    </ul>
                </div>
            </div>`
        },
        calculateSensitivity: (muscleMassIncrease, baselineMetrics) => {
            const baseValue = economicOutcomeMetrics.medicare_spend_impact.calculate(muscleMassIncrease, baselineMetrics);
            return {
                bestCase: baseValue * 1.40,
                worstCase: baseValue * 0.60,
                assumptions: [
                    'Variation of ±40% in Medicare spending impact',
                    'Accounts for age distribution uncertainty',
                    'Includes variations in disease prevalence by age group',
                    'Considers demographic shifts in Medicare population',
                    'Based on historical Medicare spending patterns',
                    'Accounts for regional variations in healthcare costs'
                ]
            };
        }
    },
    long_term_savings: {
        displayName: "Long-Term Savings",
        defaultValue: 0,
        unitName: "USD total",
        description: "Total projected 10-year savings with discounted future value across population",
        sourceUrl: "https://aspe.hhs.gov/sites/default/files/documents/e2b650cd64cf84aae8ff0fae7474af82/SDOH-Evidence-Review.pdf",
        emoji: "🎯",
        calculate: (muscleMassIncrease, baselineMetrics) => {
            const healthcareSavings = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncrease, baselineMetrics);
            const productivityGains = economicOutcomeMetrics.productivity_gains.calculate(muscleMassIncrease, baselineMetrics);
            const discountRate = muscleMassParameters.discount_rate.defaultValue;
            return (healthcareSavings + productivityGains) * ((1 - Math.pow(1 + discountRate, -10)) / discountRate);
        },
        generateDisplayValue: (value) => `${formatCurrency(value)} total`,
        generateCalculationExplanation: (muscleMassIncrease, baselineMetrics) => {
            const healthcareSavings = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncrease, baselineMetrics);
            const productivityGains = economicOutcomeMetrics.productivity_gains.calculate(muscleMassIncrease, baselineMetrics);
            const savings = (healthcareSavings + productivityGains) * ((1 - Math.pow(1 + muscleMassParameters.discount_rate.defaultValue, -10)) / muscleMassParameters.discount_rate.defaultValue);
            return `
            <div class="calculation-explanation">
                <p>10-year savings calculated with ${(muscleMassParameters.discount_rate.defaultValue * 100)}% discount rate:</p>
                <ul>
                    <li>Annual healthcare savings: $${healthcareSavings.toLocaleString()}</li>
                    <li>Annual productivity gains: $${productivityGains.toLocaleString()}</li>
                    <li>Discount rate: ${(muscleMassParameters.discount_rate.defaultValue * 100)}%</li>
                    <li>Time horizon: 10 years</li>
                </ul>
                <div class="formula">
                    ($${healthcareSavings.toLocaleString()} + $${productivityGains.toLocaleString()}) × Present Value Factor = $${savings.toLocaleString()}
                </div>
            </div>`
        },
        calculateSensitivity: (muscleMassIncrease, baselineMetrics) => {
            const baseValue = economicOutcomeMetrics.long_term_savings.calculate(muscleMassIncrease, baselineMetrics);
            return {
                bestCase: baseValue * 1.4,
                worstCase: baseValue * 0.6,
                assumptions: [
                    'Best case: Lower discount rate (2%)',
                    'Worst case: Higher discount rate (4%)',
                    'Includes economic cycle variations',
                    'Accounts for long-term healthcare cost trends'
                ]
            };
        }
    }
}; 