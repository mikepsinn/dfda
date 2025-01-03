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
        description: "Total annual healthcare cost savings from reduced falls and improved health outcomes across population",
        sourceUrl: muscleMassParameters.fall_cost.sourceUrl,
        emoji: "💰",
        calculate: (muscleMassIncrease, baselineMetrics) => {
            const fallRisk = muscleMassParameters.fall_risk.defaultValue;
            const fallReduction = Math.min(0.30, muscleMassIncrease * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue);
            return fallRisk * fallReduction * baselineMetrics.population_size * muscleMassParameters.fall_cost.defaultValue;
        },
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncrease, baselineMetrics) => {
            const fallRisk = muscleMassParameters.fall_risk.defaultValue;
            const fallReduction = Math.min(0.30, muscleMassIncrease * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue);
            const savings = fallRisk * fallReduction * baselineMetrics.population_size * muscleMassParameters.fall_cost.defaultValue;
            return `
            <div class="calculation-explanation">
                <p>Healthcare savings are calculated based on reduced falls:</p>
                <ul>
                    <li>Baseline fall risk: ${(fallRisk * 100).toFixed(1)}%</li>
                    <li>Fall risk reduction: ${(fallReduction * 100).toFixed(1)}%</li>
                    <li>Population size: ${baselineMetrics.population_size.toLocaleString()}</li>
                    <li>Average cost per fall: $${muscleMassParameters.fall_cost.defaultValue.toLocaleString()}</li>
                </ul>
                <div class="formula">
                    ${(fallRisk * 100).toFixed(1)}% × ${(fallReduction * 100).toFixed(1)}% × ${baselineMetrics.population_size.toLocaleString()} × $${muscleMassParameters.fall_cost.defaultValue.toLocaleString()} = $${savings.toLocaleString()}
                </div>
            </div>`
        },
        calculateSensitivity: (muscleMassIncrease, baselineMetrics) => {
            const baseValue = muscleMassParameters.fall_risk.defaultValue * 
                            Math.min(0.30, muscleMassIncrease * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue) * 
                            baselineMetrics.population_size * muscleMassParameters.fall_cost.defaultValue;
            return {
                bestCase: baseValue * 1.3,
                worstCase: baseValue * 0.7,
                assumptions: [
                    'Healthcare cost variation of ±30%',
                    'Includes regional cost variations',
                    'Accounts for different healthcare systems'
                ]
            };
        }
    },
    productivity_gains: {
        displayName: "Productivity Gains",
        defaultValue: 0,
        unitName: "USD/year total",
        description: "Total annual economic gains from improved workforce productivity across population",
        sourceUrl: muscleMassParameters.productivity_gain_per_lb.sourceUrl,
        emoji: "📈",
        calculate: (muscleMassIncrease, baselineMetrics) => 
            muscleMassIncrease * muscleMassParameters.productivity_gain_per_lb.defaultValue * baselineMetrics.population_size,
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncrease, baselineMetrics) => {
            const gains = muscleMassIncrease * muscleMassParameters.productivity_gain_per_lb.defaultValue * baselineMetrics.population_size;
            return `
            <div class="calculation-explanation">
                <p>Productivity gains are estimated at $${muscleMassParameters.productivity_gain_per_lb.defaultValue} per pound of muscle mass per person per year:</p>
                <div class="formula">
                    ${muscleMassIncrease} lbs × $${muscleMassParameters.productivity_gain_per_lb.defaultValue} × ${baselineMetrics.population_size.toLocaleString()} people = $${gains.toLocaleString()}
                </div>
            </div>`
        },
        calculateSensitivity: (muscleMassIncrease, baselineMetrics) => {
            const baseValue = muscleMassIncrease * muscleMassParameters.productivity_gain_per_lb.defaultValue * baselineMetrics.population_size;
            return {
                bestCase: muscleMassIncrease * 150 * baselineMetrics.population_size,
                worstCase: muscleMassIncrease * 50 * baselineMetrics.population_size,
                assumptions: [
                    'Best case: $150 productivity gain per pound',
                    'Worst case: $50 productivity gain per pound',
                    'Based on workforce participation and wage variations'
                ]
            };
        }
    },
    total_economic_benefit: {
        displayName: "Total Economic Benefit",
        defaultValue: 0,
        unitName: "USD/year total",
        description: "Total annual economic benefit including healthcare savings and productivity gains across population",
        sourceUrl: muscleMassParameters.productivity_gain_per_lb.sourceUrl,
        emoji: "💎",
        calculate: (muscleMassIncrease, baselineMetrics) => {
            const healthcareSavings = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncrease, baselineMetrics);
            const productivityGains = economicOutcomeMetrics.productivity_gains.calculate(muscleMassIncrease, baselineMetrics);
            return healthcareSavings + productivityGains;
        },
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncrease, baselineMetrics) => {
            const healthcareSavings = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncrease, baselineMetrics);
            const productivityGains = economicOutcomeMetrics.productivity_gains.calculate(muscleMassIncrease, baselineMetrics);
            return `
            <div class="calculation-explanation">
                <p>Total economic benefit is the sum of healthcare savings and productivity gains:</p>
                <div class="formula">
                    Healthcare Savings: $${healthcareSavings.toLocaleString()}<br>
                    Productivity Gains: $${productivityGains.toLocaleString()}<br>
                    Total: $${(healthcareSavings + productivityGains).toLocaleString()}
                </div>
            </div>`
        },
        calculateSensitivity: (muscleMassIncrease, baselineMetrics) => {
            const healthcareSensitivity = economicOutcomeMetrics.healthcare_savings.calculateSensitivity(muscleMassIncrease, baselineMetrics);
            const productivitySensitivity = economicOutcomeMetrics.productivity_gains.calculateSensitivity(muscleMassIncrease, baselineMetrics);
            return {
                bestCase: healthcareSensitivity.bestCase + productivitySensitivity.bestCase,
                worstCase: healthcareSensitivity.worstCase + productivitySensitivity.worstCase,
                assumptions: [
                    'Combined sensitivity of healthcare savings and productivity gains',
                    'Assumes independent variation of components'
                ]
            };
        }
    },
    qalys_gained: {
        displayName: "Quality-Adjusted Life Years Gained",
        defaultValue: 0,
        unitName: "QALYs total",
        description: "Total additional quality-adjusted life years gained across population from the intervention",
        sourceUrl: muscleMassParameters.qaly_gain_per_lb.sourceUrl,
        emoji: "✨",
        calculate: (muscleMassIncrease, baselineMetrics) => 
            muscleMassIncrease * muscleMassParameters.qaly_gain_per_lb.defaultValue * baselineMetrics.population_size,
        generateDisplayValue: (value) => `${formatLargeNumber(value)} QALYs total`,
        generateCalculationExplanation: (muscleMassIncrease, baselineMetrics) => {
            const qalys = muscleMassIncrease * muscleMassParameters.qaly_gain_per_lb.defaultValue * baselineMetrics.population_size;
            return `
            <div class="calculation-explanation">
                <p>Each pound of muscle mass adds ${muscleMassParameters.qaly_gain_per_lb.defaultValue} QALYs per person:</p>
                <div class="formula">
                    ${muscleMassIncrease} lbs × ${muscleMassParameters.qaly_gain_per_lb.defaultValue} QALYs × ${baselineMetrics.population_size.toLocaleString()} people = ${qalys.toLocaleString()} QALYs
                </div>
            </div>`
        },
        calculateSensitivity: (muscleMassIncrease, baselineMetrics) => {
            const baseValue = muscleMassIncrease * muscleMassParameters.qaly_gain_per_lb.defaultValue * baselineMetrics.population_size;
            return {
                bestCase: muscleMassIncrease * 0.03 * baselineMetrics.population_size,
                worstCase: muscleMassIncrease * 0.01 * baselineMetrics.population_size,
                assumptions: [
                    'Best case: 0.03 QALYs per pound',
                    'Worst case: 0.01 QALYs per pound',
                    'Based on quality of life assessment variations'
                ]
            };
        }
    },
    medicare_spend_impact: {
        displayName: "Medicare Spend Impact",
        defaultValue: 0,
        unitName: "USD/year total",
        description: "Total annual impact on Medicare spending from improved health outcomes across population",
        sourceUrl: "https://www.cms.gov/research-statistics-data-and-systems/statistics-trends-and-reports/nationalhealthexpenddata",
        emoji: "🏥",
        calculate: (muscleMassIncrease, baselineMetrics) => {
            const mortalityReduction = Math.min(0.20, muscleMassIncrease * muscleMassParameters.mortality_reduction_per_lb.defaultValue);
            return baselineMetrics.medicare_total_annual_spend * mortalityReduction;
        },
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncrease, baselineMetrics) => {
            const mortalityReduction = Math.min(0.20, muscleMassIncrease * muscleMassParameters.mortality_reduction_per_lb.defaultValue);
            const impact = baselineMetrics.medicare_total_annual_spend * mortalityReduction;
            return `
            <div class="calculation-explanation">
                <p>Medicare spend impact is calculated based on mortality reduction:</p>
                <ul>
                    <li>Mortality reduction: ${(mortalityReduction * 100).toFixed(1)}%</li>
                    <li>Total Medicare spend: $${baselineMetrics.medicare_total_annual_spend.toLocaleString()}</li>
                </ul>
                <div class="formula">
                    ${(mortalityReduction * 100).toFixed(1)}% × $${baselineMetrics.medicare_total_annual_spend.toLocaleString()} = $${impact.toLocaleString()}
                </div>
            </div>`
        },
        calculateSensitivity: (muscleMassIncrease, baselineMetrics) => {
            const baseValue = baselineMetrics.medicare_total_annual_spend * Math.min(0.20, muscleMassIncrease * muscleMassParameters.mortality_reduction_per_lb.defaultValue);
            return {
                bestCase: baseValue * 1.25,
                worstCase: baseValue * 0.75,
                assumptions: [
                    'Variation of ±25% in Medicare spending impact',
                    'Accounts for policy and demographic variations',
                    'Based on historical Medicare spending patterns'
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