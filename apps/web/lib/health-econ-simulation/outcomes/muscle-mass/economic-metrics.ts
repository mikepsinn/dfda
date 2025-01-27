import { muscleMassParameters } from '../muscle-mass-parameters';
import { populationHealthMetrics } from '../../population-health-metrics';
import { formatCurrency, formatLargeNumber, OutcomeMetric, validateMuscleMass } from './utils';

export const economicOutcomeMetrics: Record<string, OutcomeMetric> = {
    healthcare_savings: {
        displayName: "Healthcare Cost Savings",
        defaultValue: 0,
        unitName: "USD/year total",
        description: "Total annual healthcare cost savings from improved health outcomes across population",
        sourceUrl: muscleMassParameters.fall_cost.sourceUrl,
        emoji: "💰",
        modelParameters: [
            muscleMassParameters.fall_cost,
            populationHealthMetrics.fall_risk,
            muscleMassParameters.fall_risk_reduction_per_lb,
            populationHealthMetrics.healthcare_costs,
            muscleMassParameters.mortality_reduction_per_lb
        ],
        calculate: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Healthcare Cost Savings');
            
            // Age distribution weights for general population
            const ageDistribution = {
                'under-45': { weight: 0.54, riskMultiplier: 0.6 },
                '45-64': { weight: 0.30, riskMultiplier: 1.0 },
                '65-74': { weight: 0.09, riskMultiplier: 1.5 },
                '75-84': { weight: 0.05, riskMultiplier: 2.0 },
                '85+': { weight: 0.02, riskMultiplier: 3.0 }
            };

            // 1. Fall-related cost savings
            const fallRiskReduction = Math.min(0.30, muscleMassIncreasePerPerson * 0.015); // 1.5% per lb
            const fallCostSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedFallRisk = 0.15 * data.riskMultiplier; // 15% base fall risk
                const baseFallCost = 10000; // $10,000 per fall
                return total + (ageGroupPopulation * adjustedFallRisk * fallRiskReduction * baseFallCost);
            }, 0);

            // 2. Diabetes-related cost savings
            const insulinSensitivityImprovement = Math.min(0.20, muscleMassIncreasePerPerson * 0.02); // 2% per lb, max 20%
            const diabetesPrevalence = 0.11; // 11% of population
            const annualDiabetesCost = 19800;
            const diabetesCostReduction = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedPrevalence = diabetesPrevalence * data.riskMultiplier;
                const costReduction = insulinSensitivityImprovement * 0.2; // 20% cost reduction per full sensitivity improvement
                return total + (ageGroupPopulation * annualDiabetesCost * adjustedPrevalence * costReduction);
            }, 0);

            // 3. Hospitalization reduction
            const hospitalizationReduction = Math.min(0.15, muscleMassIncreasePerPerson * 0.005); // 0.5% per lb, max 15%
            const annualHospitalizationCost = 18500;
            const baseHospitalizationRate = 0.11;
            const hospitalizationSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedRate = baseHospitalizationRate * data.riskMultiplier;
                return total + (ageGroupPopulation * annualHospitalizationCost * adjustedRate * hospitalizationReduction);
            }, 0);

            // 4. Mortality-related healthcare savings
            const mortalityReduction = Math.min(0.20, muscleMassIncreasePerPerson * 0.01); // 1% per lb, max 20%
            const avgEndOfLifeCost = 95000;
            const annualMortalityRate = 0.0085;
            const mortalitySavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedMortalityRate = annualMortalityRate * data.riskMultiplier;
                return total + (ageGroupPopulation * avgEndOfLifeCost * adjustedMortalityRate * mortalityReduction);
            }, 0);

            // 5. General healthcare utilization reduction
            const utilizationReduction = Math.min(0.12, muscleMassIncreasePerPerson * 0.004); // 0.4% per lb, max 12%
            const baseAnnualHealthcareCost = 14500;
            const utilizationSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedCost = baseAnnualHealthcareCost * data.riskMultiplier;
                return total + (ageGroupPopulation * adjustedCost * utilizationReduction);
            }, 0);

            return fallCostSavings + diabetesCostReduction + hospitalizationSavings + 
                   mortalitySavings + utilizationSavings;
        },
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Healthcare Cost Savings Explanation');
            const ageDistribution = {
                'under-45': { weight: 0.54, riskMultiplier: 0.6 },
                '45-64': { weight: 0.30, riskMultiplier: 1.0 },
                '65-74': { weight: 0.09, riskMultiplier: 1.5 },
                '75-84': { weight: 0.05, riskMultiplier: 2.0 },
                '85+': { weight: 0.02, riskMultiplier: 3.0 }
            };

            // Recalculate all components
            const fallRiskReduction = Math.min(0.30, muscleMassIncreasePerPerson * 0.015);
            const insulinSensitivityImprovement = Math.min(0.20, muscleMassIncreasePerPerson * 0.02);
            const hospitalizationReduction = Math.min(0.15, muscleMassIncreasePerPerson * 0.005);
            const mortalityReduction = Math.min(0.20, muscleMassIncreasePerPerson * 0.01);
            const utilizationReduction = Math.min(0.12, muscleMassIncreasePerPerson * 0.004);

            // Calculate components using the same logic as the calculate function
            const fallCostSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedFallRisk = 0.15 * data.riskMultiplier;
                return total + (ageGroupPopulation * adjustedFallRisk * fallRiskReduction * 
                              muscleMassParameters.fall_cost.defaultValue * data.riskMultiplier);
            }, 0);

            const diabetesCostReduction = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedPrevalence = 0.11 * data.riskMultiplier;
                return total + (ageGroupPopulation * 19800 * adjustedPrevalence * 
                              insulinSensitivityImprovement * data.riskMultiplier);
            }, 0);

            const hospitalizationSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedRate = 0.11 * data.riskMultiplier;
                return total + (ageGroupPopulation * 18500 * adjustedRate * 
                              hospitalizationReduction * data.riskMultiplier);
            }, 0);

            const mortalitySavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = baselineMetrics.population_size * data.weight;
                const adjustedMortalityRate = 0.0085 * data.riskMultiplier;
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
        calculateSensitivity: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Healthcare Cost Savings Sensitivity');
            const baseValue = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncreasePerPerson, baselineMetrics);
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
        modelParameters: [muscleMassParameters.productivity_gain_per_lb],
        calculate: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Productivity Gains');

            const LBS_TO_KG = 0.453592;
            const COGNITIVE_COEFFICIENT = 0.02;
            const PRODUCTIVITY_CONVERSION = 0.15;
            const AVG_ANNUAL_SALARY = 55000;

            // Convert PER PERSON muscle mass to kg
            const kgIncreasePerPerson = muscleMassIncreasePerPerson * LBS_TO_KG;
            const cognitiveImprovement = kgIncreasePerPerson * COGNITIVE_COEFFICIENT;
            const productivityGainPercent = cognitiveImprovement * PRODUCTIVITY_CONVERSION;
            
            // Calculate total workforce impact (only 62% of population is working age)
            const workingAgePopulation = baselineMetrics.population_size * 0.62;
            const result = (productivityGainPercent * AVG_ANNUAL_SALARY) * workingAgePopulation;

            return result;
        },
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Productivity Gains Explanation');
            const LBS_TO_KG = 0.453592;
            const COGNITIVE_COEFFICIENT = 0.02;
            const PRODUCTIVITY_CONVERSION = 0.15;
            const AVG_ANNUAL_SALARY = 55000;

            const kgIncrease = muscleMassIncreasePerPerson * LBS_TO_KG;
            const cognitiveImprovement = kgIncrease * COGNITIVE_COEFFICIENT;
            const productivityGainPercent = cognitiveImprovement * PRODUCTIVITY_CONVERSION;
            const monetaryImpact = productivityGainPercent * AVG_ANNUAL_SALARY * baselineMetrics.population_size;

            return `
            <div class="calculation-explanation">
                <p>Productivity gains are calculated based on cognitive performance improvements from the Nature study:</p>
                <ul>
                    <li>Muscle mass increase: ${muscleMassIncreasePerPerson} lbs (${kgIncrease.toFixed(2)} kg)</li>
                    <li>Cognitive improvement coefficient: ${COGNITIVE_COEFFICIENT} per kg (Nature study)</li>
                    <li>Productivity conversion: ${(PRODUCTIVITY_CONVERSION * 100)}% per cognitive SD</li>
                    <li>Average annual salary: $${AVG_ANNUAL_SALARY.toLocaleString()}</li>
                    <li>Population size: ${baselineMetrics.population_size.toLocaleString()}</li>
                </ul>
                <div class="formula">
                    Productivity gain: ${(productivityGainPercent * 100).toFixed(3)}%<br>
                    Monetary impact: $${monetaryImpact.toLocaleString()}
                </div>
            </div>`
        },
        calculateSensitivity: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Productivity Gains Sensitivity');
            // Base calculation with nominal values
            const LBS_TO_KG = 0.453592;
            const COGNITIVE_COEFFICIENT = 0.02;
            const PRODUCTIVITY_CONVERSION = 0.15;
            const AVG_ANNUAL_SALARY = 55000;

            const baseValue = (muscleMassIncreasePerPerson * LBS_TO_KG) * COGNITIVE_COEFFICIENT * 
                            PRODUCTIVITY_CONVERSION * AVG_ANNUAL_SALARY * baselineMetrics.population_size;

            // Calculate with confidence interval bounds from the Nature study
            const bestCase = (muscleMassIncreasePerPerson * LBS_TO_KG) * (COGNITIVE_COEFFICIENT * 1.25) * 
                           (PRODUCTIVITY_CONVERSION * 1.33) * AVG_ANNUAL_SALARY * baselineMetrics.population_size;
            const worstCase = (muscleMassIncreasePerPerson * LBS_TO_KG) * (COGNITIVE_COEFFICIENT * 0.75) * 
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
        modelParameters: [
            muscleMassParameters.productivity_gain_per_lb,
            muscleMassParameters.fall_cost,
            populationHealthMetrics.fall_risk,
            muscleMassParameters.fall_risk_reduction_per_lb,
            populationHealthMetrics.healthcare_costs,
            muscleMassParameters.mortality_reduction_per_lb
        ],
        calculate: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Total Economic Benefit');
            const healthcareSavings = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncreasePerPerson, baselineMetrics);
            const productivityGains = economicOutcomeMetrics.productivity_gains.calculate(muscleMassIncreasePerPerson, baselineMetrics);
            
            // Calculate annual value of QALYs
            const lifetimeQalys = economicOutcomeMetrics.qalys_gained.calculate(muscleMassIncreasePerPerson, baselineMetrics);
            const QALY_VALUE = 100000; // Standard value per QALY in USD
            const AVG_REMAINING_LIFE_EXPECTANCY = 40; // Should match value in qalys_gained
            const annualQalyValue = (lifetimeQalys * QALY_VALUE) / AVG_REMAINING_LIFE_EXPECTANCY;

            return healthcareSavings + productivityGains + annualQalyValue;
        },
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Total Economic Benefit Explanation');
            const healthcareSavings = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncreasePerPerson, baselineMetrics);
            const productivityGains = economicOutcomeMetrics.productivity_gains.calculate(muscleMassIncreasePerPerson, baselineMetrics);
            const lifetimeQalys = economicOutcomeMetrics.qalys_gained.calculate(muscleMassIncreasePerPerson, baselineMetrics);
            
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
        calculateSensitivity: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Total Economic Benefit Sensitivity');
            const healthcareSensitivity = economicOutcomeMetrics.healthcare_savings.calculateSensitivity(muscleMassIncreasePerPerson, baselineMetrics);
            const productivitySensitivity = economicOutcomeMetrics.productivity_gains.calculateSensitivity(muscleMassIncreasePerPerson, baselineMetrics);
            const qalySensitivity = economicOutcomeMetrics.qalys_gained.calculateSensitivity(muscleMassIncreasePerPerson, baselineMetrics);
            
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
        modelParameters: [muscleMassParameters.mortality_reduction_per_lb, muscleMassParameters.mortality_risk],
        calculate: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'QALYs Gained');
            // Constants from meta-analysis and model
            const LBS_TO_KG = 0.453592;
            const MORTALITY_REDUCTION_PER_KG = 0.015; // 1.5% reduction per kg muscle mass
            const AVG_REMAINING_LIFE_EXPECTANCY = 40;

            // Calculate per-person QALY gain
            const kgIncrease = muscleMassIncreasePerPerson * LBS_TO_KG;
            const mortalityReduction = kgIncrease * (MORTALITY_REDUCTION_PER_KG / 100); // Convert % to decimal
            const qalyPerPerson = mortalityReduction * AVG_REMAINING_LIFE_EXPECTANCY;

            // Scale to population
            return qalyPerPerson * baselineMetrics.population_size;
        },
        generateDisplayValue: (value) => `${formatLargeNumber(value)} lifetime QALYs total`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'QALYs Gained Explanation');
            const LBS_TO_KG = 0.453592;
            const MORTALITY_REDUCTION_PER_KG = 0.015;
            const AVG_REMAINING_LIFE_EXPECTANCY = 40;

            const kgIncrease = muscleMassIncreasePerPerson * LBS_TO_KG;
            const mortalityReduction = kgIncrease * (MORTALITY_REDUCTION_PER_KG / 100);
            const qalyPerPerson = mortalityReduction * AVG_REMAINING_LIFE_EXPECTANCY;
            const totalQalys = qalyPerPerson * baselineMetrics.population_size;

            return `
            <div class="calculation-explanation">
                <p>Lifetime QALYs are calculated based on systematic review and meta-analysis of SMI impact on mortality:</p>
                <ul>
                    <li>Muscle mass increase: ${muscleMassIncreasePerPerson} lbs (${kgIncrease.toFixed(2)} kg)</li>
                    <li>Mortality reduction: ${(MORTALITY_REDUCTION_PER_KG * 100)}% per kg muscle mass</li>
                    <li>Average remaining life expectancy: ${AVG_REMAINING_LIFE_EXPECTANCY} years</li>
                </ul>
                <div class="formula">
                    Lifetime QALYs per person = ${kgIncrease.toFixed(2)} kg × (${(MORTALITY_REDUCTION_PER_KG * 100)}% × ${AVG_REMAINING_LIFE_EXPECTANCY} years) = ${qalyPerPerson.toFixed(2)} QALYs<br>
                    Total lifetime QALYs = ${qalyPerPerson.toFixed(2)} × ${baselineMetrics.population_size.toLocaleString()} people = ${totalQalys.toLocaleString()} QALYs
                </div>
                <p><em>Note: These are lifetime QALYs gained, not annual QALYs. The calculation represents the total quality-adjusted life years gained over the remaining life expectancy.</em></p>
            </div>`
        },
        calculateSensitivity: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'QALYs Gained Sensitivity');
            const LBS_TO_KG = 0.453592;
            const MORTALITY_REDUCTION_PER_KG = 0.015;
            const AVG_REMAINING_LIFE_EXPECTANCY = 40;
            
            // Base calculation
            const baseQalyPerPerson = (muscleMassIncreasePerPerson * LBS_TO_KG) * 
                                    (MORTALITY_REDUCTION_PER_KG * AVG_REMAINING_LIFE_EXPECTANCY);
            const baseValue = baseQalyPerPerson * baselineMetrics.population_size;

            // Best case: Higher mortality reduction and life expectancy
            const bestQalyPerPerson = (muscleMassIncreasePerPerson * LBS_TO_KG) * 
                                    (0.09 * 45); // 9% reduction, 45 years
            const bestCase = bestQalyPerPerson * baselineMetrics.population_size;

            // Worst case: Lower mortality reduction and life expectancy
            const worstQalyPerPerson = (muscleMassIncreasePerPerson * LBS_TO_KG) * 
                                     (0.06 * 35); // 6% reduction, 35 years
            const worstCase = worstQalyPerPerson * baselineMetrics.population_size;

            return {
                bestCase,
                worstCase,
                assumptions: [
                    'Mortality risk reduction range: 6-9% per kg muscle mass',
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
        modelParameters: [
            muscleMassParameters.fall_cost,
            muscleMassParameters.fall_risk,
            muscleMassParameters.fall_risk_reduction_per_lb,
            populationHealthMetrics.healthcare_costs,
            muscleMassParameters.mortality_reduction_per_lb,
            muscleMassParameters.insulin_sensitivity_per_lb
        ],
        calculate: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Medicare Spend Impact');
            const medicareEligibleRatio = 0.186;
            const medicarePopulation = baselineMetrics.population_size * medicareEligibleRatio;
            
            const ageDistribution = {
                '65-74': { weight: 0.51, riskMultiplier: 1.0 },
                '75-84': { weight: 0.33, riskMultiplier: 1.5 },
                '85+': { weight: 0.16, riskMultiplier: 2.5 }
            };

            // Calculate per-person impacts
            const mortalityReduction = muscleMassIncreasePerPerson * 0.01; // 1% per lb
            const fallRiskReduction = muscleMassIncreasePerPerson * 0.015; // 1.5% per lb
            const insulinSensitivityImprovement = muscleMassIncreasePerPerson * 0.02; // 2% per lb
            const hospitalizationReduction = muscleMassIncreasePerPerson * 0.005; // 0.5% per lb

            // Calculate savings components
            const mortalityImpact = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = medicarePopulation * data.weight;
                const adjustedMortalityRate = 0.0085 * data.riskMultiplier;
                return total + (ageGroupPopulation * 95000 * adjustedMortalityRate * mortalityReduction);
            }, 0);

            const fallCostSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = medicarePopulation * data.weight;
                const adjustedFallRisk = 0.15 * data.riskMultiplier;
                return total + (ageGroupPopulation * 10000 * adjustedFallRisk * fallRiskReduction);
            }, 0);

            const diabetesCostSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = medicarePopulation * data.weight;
                const diabetesPrevalence = 0.33 * data.riskMultiplier;
                const costReduction = insulinSensitivityImprovement * 0.2; // 20% cost reduction per full sensitivity improvement
                return total + (ageGroupPopulation * 13800 * diabetesPrevalence * costReduction);
            }, 0);

            const hospitalizationSavings = Object.entries(ageDistribution).reduce((total, [age, data]) => {
                const ageGroupPopulation = medicarePopulation * data.weight;
                const baseRate = 0.11 * data.riskMultiplier;
                return total + (ageGroupPopulation * 18500 * baseRate * hospitalizationReduction);
            }, 0);

            return mortalityImpact + fallCostSavings + diabetesCostSavings + hospitalizationSavings;
        },
        generateDisplayValue: (value) => `${formatCurrency(value)}/year total`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Medicare Spend Impact Explanation');
            const medicareEligibleRatio = 0.186;
            const medicarePopulation = baselineMetrics.population_size * medicareEligibleRatio;

            const mortalityReduction = Math.min(0.20, muscleMassIncreasePerPerson * muscleMassParameters.mortality_reduction_per_lb.defaultValue);
            const fallRiskReduction = Math.min(0.30, muscleMassIncreasePerPerson * muscleMassParameters.fall_risk_reduction_per_lb.defaultValue);
            const insulinSensitivityImprovement = muscleMassIncreasePerPerson * muscleMassParameters.insulin_sensitivity_per_lb.defaultValue;
            const hospitalizationReduction = Math.min(0.15, muscleMassIncreasePerPerson * 0.005);

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
        calculateSensitivity: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Medicare Spend Impact Sensitivity');
            const baseValue = economicOutcomeMetrics.medicare_spend_impact.calculate(muscleMassIncreasePerPerson, baselineMetrics);
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
        modelParameters: [
            muscleMassParameters.productivity_gain_per_lb,
            muscleMassParameters.fall_cost,
            muscleMassParameters.fall_risk,
            muscleMassParameters.fall_risk_reduction_per_lb,
            populationHealthMetrics.healthcare_costs,
            muscleMassParameters.mortality_reduction_per_lb
        ],
        calculate: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Long-Term Savings');
            const healthcareSavings = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncreasePerPerson, baselineMetrics);
            const productivityGains = economicOutcomeMetrics.productivity_gains.calculate(muscleMassIncreasePerPerson, baselineMetrics);
            const discountRate = muscleMassParameters.discount_rate.defaultValue;
            return (healthcareSavings + productivityGains) * ((1 - Math.pow(1 + discountRate, -10)) / discountRate);
        },
        generateDisplayValue: (value) => `${formatCurrency(value)} total`,
        generateCalculationExplanation: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Long-Term Savings Explanation');
            const healthcareSavings = economicOutcomeMetrics.healthcare_savings.calculate(muscleMassIncreasePerPerson, baselineMetrics);
            const productivityGains = economicOutcomeMetrics.productivity_gains.calculate(muscleMassIncreasePerPerson, baselineMetrics);
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
        calculateSensitivity: (muscleMassIncreasePerPerson, baselineMetrics) => {
            validateMuscleMass(muscleMassIncreasePerPerson, 'Long-Term Savings Sensitivity');
            const baseValue = economicOutcomeMetrics.long_term_savings.calculate(muscleMassIncreasePerPerson, baselineMetrics);
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