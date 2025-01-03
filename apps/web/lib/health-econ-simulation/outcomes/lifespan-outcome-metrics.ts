import { ModelParameter } from '../types';

export const lifespanOutcomeMetrics: Record<string, ModelParameter> = {
    additional_years: {
        displayName: "Additional Years of Life",
        defaultValue: 0,
        unitName: "years",
        description: "Additional years of life gained from the intervention",
        sourceUrl: "https://www.cdc.gov/nchs/fastats/life-expectancy.htm",
        emoji: "⌛"
    },
    gdp_impact: {
        displayName: "GDP Impact",
        defaultValue: 0,
        unitName: "USD",
        description: "Economic impact from additional productive years in the workforce",
        sourceUrl: "https://www.bea.gov/data/gdp/gross-domestic-product",
        emoji: "📈"
    },
    medicare_savings: {
        displayName: "Medicare Savings",
        defaultValue: 0,
        unitName: "USD",
        description: "Healthcare cost savings from delayed Medicare utilization",
        sourceUrl: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet",
        emoji: "💉"
    },
    private_insurance_savings: {
        displayName: "Private Insurance Savings",
        defaultValue: 0,
        unitName: "USD",
        description: "Healthcare cost savings from delayed private insurance utilization",
        sourceUrl: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet",
        emoji: "🏦"
    },
    social_security_savings: {
        displayName: "Social Security Savings",
        defaultValue: 0,
        unitName: "USD",
        description: "Cost savings from delayed Social Security benefit payments",
        sourceUrl: "https://www.ssa.gov/policy/docs/chartbooks/fast_facts/2021/fast_facts21.html",
        emoji: "👴"
    },
    medicare_spend_impact: {
        displayName: "Medicare Spend Impact",
        defaultValue: 0,
        unitName: "USD",
        description: "Impact on total Medicare spending from mortality reduction",
        sourceUrl: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet",
        emoji: "🏥"
    },
    total_economic_impact: {
        displayName: "Total Economic Impact",
        defaultValue: 0,
        unitName: "USD",
        description: "Total economic benefit including GDP impact and all cost savings",
        sourceUrl: "https://www.whitehouse.gov/cea/written-materials/2024/02/27/valuing-the-future-revision-to-the-social-discount-rate-means-appropriately-assessing-benefits-and-costs/",
        emoji: "💎"
    }
}; 