import { ModelParameter } from '../types';

export const muscleMassParameters: Record<string, ModelParameter> = {
    resting_metabolic_rate: {
        displayName: "Resting Metabolic Rate",
        defaultValue: 1800,
        unitName: "calories/day",
        description: "Average number of calories burned at rest per day",
        sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK237991/",
        emoji: "🔥"
    },
    insulin_sensitivity: {
        displayName: "Baseline Insulin Sensitivity",
        defaultValue: 1.0,
        unitName: "relative scale",
        description: "Baseline measure of how effectively cells respond to insulin",
        sourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6170977/",
        emoji: "📊"
    },
    fall_risk: {
        displayName: "Annual Fall Risk",
        defaultValue: 0.15,
        unitName: "probability",
        description: "Probability of experiencing a fall within a year",
        sourceUrl: "https://www.cdc.gov/falls/data/fall-deaths.html",
        emoji: "⚠️"
    },
    healthcare_costs: {
        displayName: "Annual Healthcare Costs",
        defaultValue: 11000,
        unitName: "USD/person/year",
        description: "Average annual healthcare costs per person",
        sourceUrl: "https://www.cms.gov/research-statistics-data-and-systems/statistics-trends-and-reports/nationalhealthexpenddata",
        emoji: "💰"
    },
    disability_risk: {
        displayName: "Annual Disability Risk",
        defaultValue: 0.10,
        unitName: "probability",
        description: "Annual probability of developing a disability",
        sourceUrl: "https://www.cdc.gov/nchs/fastats/disability.htm",
        emoji: "🦽"
    },
    mortality_risk: {
        displayName: "Annual Mortality Risk",
        defaultValue: 0.02,
        unitName: "probability",
        description: "Annual probability of death in the target population",
        sourceUrl: "https://www.cdc.gov/nchs/fastats/deaths.htm",
        emoji: "📉"
    },
    muscle_calorie_burn: {
        displayName: "Muscle Calorie Burn Rate",
        defaultValue: 8,
        unitName: "calories/lb/day",
        description: "Number of calories burned per pound of muscle per day",
        sourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3139779/",
        emoji: "💪"
    },
    insulin_sensitivity_per_lb: {
        displayName: "Insulin Sensitivity Improvement per Pound",
        defaultValue: 0.02,
        unitName: "relative improvement/lb",
        description: "Improvement in insulin sensitivity per pound of muscle gained",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/24223309/",
        emoji: "📈"
    },
    fall_risk_reduction_per_lb: {
        displayName: "Fall Risk Reduction per Pound",
        defaultValue: 0.015,
        unitName: "reduction/lb",
        description: "Reduction in fall risk per pound of muscle gained",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/30541350/",
        emoji: "🛡️"
    },
    mortality_reduction_per_lb: {
        displayName: "Mortality Reduction per Pound",
        defaultValue: 0.01,
        unitName: "reduction/lb",
        description: "Reduction in mortality risk per pound of muscle gained",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/29425700/",
        emoji: "❤️"
    },
    fall_cost: {
        displayName: "Cost per Fall",
        defaultValue: 10000,
        unitName: "USD/fall",
        description: "Average healthcare cost associated with a fall incident",
        sourceUrl: "https://www.cdc.gov/falls/data/fall-cost.html",
        emoji: "🏥"
    },
    productivity_gain_per_lb: {
        displayName: "Productivity Gain per Pound",
        defaultValue: 100,
        unitName: "USD/lb/year",
        description: "Estimated annual productivity gain per pound of muscle mass",
        sourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6322506/",
        emoji: "💼"
    },
    qaly_gain_per_lb: {
        displayName: "QALY Gain per Pound",
        defaultValue: 0.02,
        unitName: "QALY/lb",
        description: "Quality-adjusted life years gained per pound of muscle mass",
        sourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5769042/",
        emoji: "✨"
    },
    discount_rate: {
        displayName: "Annual Discount Rate",
        defaultValue: 0.03,
        unitName: "rate",
        description: "Annual rate used for discounting future economic benefits",
        sourceUrl: "https://www.whitehouse.gov/wp-content/uploads/2023/01/M-23-05-2023-Discount-Rates.pdf",
        emoji: "📅"
    }
}; 