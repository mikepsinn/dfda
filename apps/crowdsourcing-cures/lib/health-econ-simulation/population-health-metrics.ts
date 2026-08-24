import { ModelParameter } from './types';

// Utility functions for formatting
const formatRate = (value: number): string => `${(value * 100).toFixed(1)}%`;
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

export const populationHealthMetrics: Record<string, ModelParameter> = {
    resting_metabolic_rate: {
        displayName: "Average Resting Metabolic Rate",
        defaultValue: 1800,
        unitName: "calories/day",
        description: "Average daily caloric burn at rest for a typical adult",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/32699189/",
        emoji: "🔥",
        generateDisplayValue: (value: number) => `${value.toFixed(0)} calories/day`
    },
    insulin_sensitivity: {
        displayName: "Baseline Insulin Sensitivity",
        defaultValue: 1.0,
        unitName: "relative scale",
        description: "Reference insulin sensitivity level for population",
        sourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6170977/",
        emoji: "📊",
        generateDisplayValue: (value: number) => value.toFixed(2)
    },
    fall_risk: {
        displayName: "Annual Fall Risk",
        defaultValue: 0.15,
        unitName: "probability",
        description: "Annual probability of experiencing a fall in general population",
        sourceUrl: "https://www.cdc.gov/falls/data/fall-deaths.html",
        emoji: "⚠️",
        generateDisplayValue: formatRate
    },
    healthcare_costs: {
        displayName: "Annual Healthcare Costs",
        defaultValue: 11000,
        unitName: "USD/person/year",
        description: "Average annual healthcare expenditure per person",
        sourceUrl: "https://www.cms.gov/research-statistics-data-and-systems/statistics-trends-and-reports/nationalhealthexpenddata",
        emoji: "💰",
        generateDisplayValue: formatCurrency
    },
    disability_risk: {
        displayName: "Annual Disability Risk",
        defaultValue: 0.10,
        unitName: "probability",
        description: "Annual probability of developing a disability",
        sourceUrl: "https://www.cdc.gov/nchs/fastats/disability.htm",
        emoji: "🦽",
        generateDisplayValue: formatRate
    },
    mortality_risk: {
        displayName: "Annual Mortality Risk",
        defaultValue: 0.02,
        unitName: "probability",
        description: "Annual mortality rate in general population",
        sourceUrl: "https://www.cdc.gov/nchs/fastats/deaths.htm",
        emoji: "📉",
        generateDisplayValue: formatRate
    },
    medicare_total_annual_spend: {
        displayName: "Total Medicare Annual Spend",
        defaultValue: 829000000000,
        unitName: "USD/year",
        description: "Total annual Medicare expenditure (2021 data)",
        sourceUrl: "https://www.cms.gov/research-statistics-data-and-systems/statistics-trends-and-reports/nationalhealthexpenddata",
        emoji: "🏥",
        generateDisplayValue: formatCurrency
    },
    diabetes_risk: {
        displayName: "Diabetes Risk",
        defaultValue: 0.11,  // 11% of US population has diabetes
        unitName: "probability",
        description: "Probability of having or developing diabetes in the general population",
        sourceUrl: "hhttps://www.cdc.gov/diabetes/php/data-research/methods.html?CDC_AAref_Val=https://www.cdc.gov/diabetes/data/statistics-report/index.html",
        emoji: "🩺",
        generateDisplayValue: formatRate
    }
}; 