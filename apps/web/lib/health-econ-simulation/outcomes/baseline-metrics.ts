import { ModelParameter } from '../types';

type BaselineMetricsType = {
    resting_metabolic_rate: ModelParameter;
    insulin_sensitivity: ModelParameter;
    fall_risk: ModelParameter;
    healthcare_costs: ModelParameter;
    disability_risk: ModelParameter;
    mortality_risk: ModelParameter;
    medicare_total_annual_spend: ModelParameter;
};

export const baselineMetrics: BaselineMetricsType = {
    resting_metabolic_rate: {
        displayName: "Baseline Resting Metabolic Rate",
        defaultValue: 1800,
        unitName: "calories/day",
        description: "Average number of calories burned at rest per day for the baseline population",
        sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4535334/",
        emoji: "🔥",
        generateDisplayValue: (value: number) => `${value.toFixed(0)} calories/day`
    },
    insulin_sensitivity: {
        displayName: "Baseline Insulin Sensitivity",
        defaultValue: 1.0,
        unitName: "relative scale",
        description: "Baseline measure of how effectively cells respond to insulin in the population",
        sourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6942754/",
        emoji: "📊",
        generateDisplayValue: (value: number) => value.toFixed(2)
    },
    fall_risk: {
        displayName: "Baseline Fall Risk",
        defaultValue: 0.15,
        unitName: "probability",
        description: "Base annual probability of experiencing a fall in the target population",
        sourceUrl: "https://www.cdc.gov/falls/index.html",
        emoji: "⚠️",
        generateDisplayValue: (value: number) => `${(value * 100).toFixed(1)}%`
    },
    healthcare_costs: {
        displayName: "Baseline Healthcare Costs",
        defaultValue: 11000,
        unitName: "USD/person/year",
        description: "Average annual healthcare costs per person in the baseline population",
        sourceUrl: "https://www.kff.org/health-costs/",
        emoji: "💰",
        generateDisplayValue: (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
    },
    disability_risk: {
        displayName: "Baseline Disability Risk",
        defaultValue: 0.10,
        unitName: "probability",
        description: "Base annual probability of developing a disability in the target population",
        sourceUrl: "https://www.worldbank.org/en/topic/disability",
        emoji: "🦽",
        generateDisplayValue: (value: number) => `${(value * 100).toFixed(1)}%`
    },
    mortality_risk: {
        displayName: "Baseline Mortality Risk",
        defaultValue: 0.02,
        unitName: "probability",
        description: "Base annual probability of death in the target population",
        sourceUrl: "https://www.ssa.gov/oact/STATS/table4c6.html",
        emoji: "📉",
        generateDisplayValue: (value: number) => `${(value * 100).toFixed(1)}%`
    },
    medicare_total_annual_spend: {
        displayName: "Total Medicare Annual Spend",
        defaultValue: 829000000000,
        unitName: "USD/year",
        description: "Total Medicare spending per year (2021 data)",
        sourceUrl: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet",
        emoji: "🏛️",
        generateDisplayValue: (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
    }
};
