import { ModelParameter } from '../types';

export const metabolicOutcomeMetrics: Record<string, ModelParameter> = {
    additional_daily_calories_burned: {
        displayName: "Additional Daily Calories Burned",
        defaultValue: 0,
        unitName: "calories/day",
        description: "Additional calories burned per day due to increased muscle mass",
        sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4535334/",
        emoji: "🔥"
    },
    annual_metabolic_impact: {
        displayName: "Annual Metabolic Impact",
        defaultValue: 0,
        unitName: "calories/year",
        description: "Total additional calories burned per year due to increased muscle mass",
        sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4535334/",
        emoji: "📅"
    }
};

export const healthOutcomeMetrics: Record<string, ModelParameter> = {
    insulin_sensitivity_improvement: {
        displayName: "Insulin Sensitivity Improvement",
        defaultValue: 0,
        unitName: "relative improvement",
        description: "Improvement in insulin sensitivity due to increased muscle mass",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/34054574/",
        emoji: "📊"
    },
    fall_risk_reduction: {
        displayName: "Fall Risk Reduction",
        defaultValue: 0,
        unitName: "probability reduction",
        description: "Reduction in probability of falls due to increased muscle mass",
        sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8775372/",
        emoji: "🛡️"
    },
    mortality_reduction: {
        displayName: "Mortality Risk Reduction",
        defaultValue: 0,
        unitName: "probability reduction",
        description: "Reduction in mortality risk due to increased muscle mass",
        sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9209691/",
        emoji: "❤️"
    }
};

export const economicOutcomeMetrics: Record<string, ModelParameter> = {
    healthcare_savings: {
        displayName: "Healthcare Cost Savings",
        defaultValue: 0,
        unitName: "USD/year",
        description: "Annual healthcare cost savings from reduced falls and improved health outcomes",
        sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6089380/",
        emoji: "💰"
    },
    productivity_gains: {
        displayName: "Productivity Gains",
        defaultValue: 0,
        unitName: "USD/year",
        description: "Annual economic gains from improved workforce productivity",
        sourceUrl: "https://aspe.hhs.gov/sites/default/files/documents/e2b650cd64cf84aae8ff0fae7474af82/SDOH-Evidence-Review.pdf",
        emoji: "📈"
    },
    total_economic_benefit: {
        displayName: "Total Economic Benefit",
        defaultValue: 0,
        unitName: "USD/year",
        description: "Total annual economic benefit including healthcare savings and productivity gains",
        sourceUrl: "https://aspe.hhs.gov/sites/default/files/documents/e2b650cd64cf84aae8ff0fae7474af82/SDOH-Evidence-Review.pdf",
        emoji: "💎"
    },
    qalys_gained: {
        displayName: "Quality-Adjusted Life Years Gained",
        defaultValue: 0,
        unitName: "QALYs",
        description: "Additional quality-adjusted life years gained from the intervention",
        sourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6684801/",
        emoji: "✨"
    },
    medicare_spend_impact: {
        displayName: "Medicare Spend Impact",
        defaultValue: 0,
        unitName: "USD/year",
        description: "Annual impact on Medicare spending from improved health outcomes",
        sourceUrl: "https://www.cms.gov/research-statistics-data-and-systems/statistics-trends-and-reports/nationalhealthexpenddata",
        emoji: "🏥"
    },
    long_term_savings: {
        displayName: "Long-Term Savings",
        defaultValue: 0,
        unitName: "USD",
        description: "Projected 10-year savings with discounted future value",
        sourceUrl: "https://aspe.hhs.gov/sites/default/files/documents/e2b650cd64cf84aae8ff0fae7474af82/SDOH-Evidence-Review.pdf",
        emoji: "🎯"
    }
}; 