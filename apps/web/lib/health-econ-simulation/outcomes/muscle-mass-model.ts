import { ModelParameter } from '../types';
import { metabolicImpactParameters, healthOutcomeParameters, economicImpactParameters } from './muscle-mass-impact-parameters';

interface BaselineMetrics {
    resting_metabolic_rate: number;  // calories per day
    insulin_sensitivity: number;      // relative scale
    fall_risk: number;               // annual probability
    healthcare_costs: number;         // annual per person
    disability_risk: number;          // annual probability
    mortality_risk: number;          // annual probability
    medicare_total_annual_spend: number;  // Total Medicare spend in USD (2021 data)
}

interface MetabolicImpact extends Record<keyof typeof metabolicImpactParameters, number> {}

interface HealthOutcomes extends Record<keyof typeof healthOutcomeParameters, number> {}

interface EconomicImpact extends Record<keyof typeof economicImpactParameters, number> {}

export class MuscleMassInterventionModel {
    private muscle_mass_increase: number;
    private population_size: number;
    private baseline_metrics: BaselineMetrics;

    constructor(muscle_mass_increase_lbs: number, population_size: number = 100000) {
        this.muscle_mass_increase = muscle_mass_increase_lbs;
        this.population_size = population_size;
        this.baseline_metrics = {
            resting_metabolic_rate: 1800,  // calories per day
            insulin_sensitivity: 1.0,      // relative scale
            fall_risk: 0.15,              // annual probability
            healthcare_costs: 11000,       // annual per person
            disability_risk: 0.10,         // annual probability
            mortality_risk: 0.02,          // annual probability
            medicare_total_annual_spend: 829000000000,  // Total Medicare spend in USD (2021 data)
        };
    }

    calculate_metabolic_impact(): MetabolicImpact {
        // Each pound of muscle burns ~6-10 calories per day
        const calorie_burn_increase = this.muscle_mass_increase * 8;
        return {
            additional_daily_calories_burned: calorie_burn_increase,
            annual_metabolic_impact: calorie_burn_increase * 365
        };
    }

    calculate_health_outcomes(): HealthOutcomes {
        // Calculate relative risk reductions based on literature
        const insulin_sensitivity_improvement = this.muscle_mass_increase * 0.02;
        const fall_risk_reduction = Math.min(0.30, this.muscle_mass_increase * 0.015);
        const mortality_reduction = Math.min(0.20, this.muscle_mass_increase * 0.01);

        return {
            insulin_sensitivity_improvement,
            fall_risk_reduction,
            mortality_reduction
        };
    }

    calculate_economic_impact(population_size?: number): EconomicImpact {
        // Use instance population_size if none provided
        const effective_population = population_size || this.population_size;

        // Calculate healthcare savings
        const fall_reduction = this.calculate_health_outcomes().fall_risk_reduction;
        const prevented_falls = this.baseline_metrics.fall_risk * fall_reduction * effective_population;
        const fall_cost_savings = prevented_falls * 10000;  // Average cost per fall

        // Calculate productivity gains
        const productivity_gain_per_person = this.muscle_mass_increase * 100;  // Conservative estimate
        const total_productivity_gain = productivity_gain_per_person * effective_population;

        // Calculate QALYs gained
        const qalys_gained = this.muscle_mass_increase * 0.02 * effective_population;

        // Calculate Medicare total annual spend impact based on mortality reduction
        const mortality_reduction = this.calculate_health_outcomes().mortality_reduction;
        const medicare_spend_impact = this.baseline_metrics.medicare_total_annual_spend * mortality_reduction;

        // Calculate long-term savings (10-year projection)
        const discount_rate = 0.03;
        const long_term_savings = (fall_cost_savings + total_productivity_gain) * 
            ((1 - Math.pow(1 + discount_rate, -10)) / discount_rate);

        return {
            healthcare_savings: fall_cost_savings,
            productivity_gains: total_productivity_gain,
            total_economic_benefit: fall_cost_savings + total_productivity_gain,
            qalys_gained,
            medicare_spend_impact,
            long_term_savings
        };
    }

    // Helper method to get parameter metadata
    getParameterMetadata(category: 'metabolic' | 'health' | 'economic', key: string): ModelParameter | undefined {
        switch (category) {
            case 'metabolic':
                return metabolicImpactParameters[key as keyof typeof metabolicImpactParameters];
            case 'health':
                return healthOutcomeParameters[key as keyof typeof healthOutcomeParameters];
            case 'economic':
                return economicImpactParameters[key as keyof typeof economicImpactParameters];
            default:
                return undefined;
        }
    }

    generate_report(population_size?: number): string {
        // Use instance population_size if none provided
        const effective_population = population_size || this.population_size;

        const metabolic = this.calculate_metabolic_impact();
        const health = this.calculate_health_outcomes();
        const economic = this.calculate_economic_impact(effective_population);

        // Get variables needed for detailed calculations
        const fall_reduction = health.fall_risk_reduction;
        const prevented_falls = this.baseline_metrics.fall_risk * fall_reduction * effective_population;
        const fall_cost_savings = prevented_falls * 10000;
        const total_productivity_gain = this.muscle_mass_increase * 100 * effective_population;
        const qalys_gained = this.muscle_mass_increase * 0.02 * effective_population;
        const discount_rate = 0.03;
        const long_term_savings = (fall_cost_savings + total_productivity_gain) * 
            ((1 - Math.pow(1 + discount_rate, -10)) / discount_rate);
        const medicare_spend_impact = economic.medicare_spend_impact;

        return `
# Muscle Mass Intervention Analysis Report
Generated on: ${new Date().toISOString().split('T')[0]}

## Intervention Details
- Muscle Mass Increase: ${this.muscle_mass_increase} lbs per person
- Target Population: ${effective_population.toLocaleString()} individuals

## Metabolic Impact
- Additional Daily Calories Burned: ${metabolic.additional_daily_calories_burned.toFixed(1)} calories/day
- Annual Metabolic Impact: ${metabolic.annual_metabolic_impact.toLocaleString()} calories/year

## Health Outcomes
- Insulin Sensitivity Improvement: ${(health.insulin_sensitivity_improvement * 100).toFixed(1)}%
- Fall Risk Reduction: ${(health.fall_risk_reduction * 100).toFixed(1)}%
- Mortality Risk Reduction: ${(health.mortality_reduction * 100).toFixed(1)}%

## Economic Impact (Annual)
- Healthcare Cost Savings: $${economic.healthcare_savings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
- Productivity Gains: $${economic.productivity_gains.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
- Medicare Total Annual Spend Impact: $${economic.medicare_spend_impact.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
- Total Economic Benefit: $${economic.total_economic_benefit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}
