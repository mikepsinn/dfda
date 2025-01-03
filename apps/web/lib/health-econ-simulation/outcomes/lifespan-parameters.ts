import { ModelParameter } from '../types';

export const lifespanParameters: Record<string, ModelParameter> = {
  base_life_expectancy: {
    displayName: "Base Life Expectancy",
    defaultValue: 77.5,
    unitName: "years",
    description: "Average life expectancy in the United States",
    sourceUrl: "https://www.cdc.gov/nchs/fastats/life-expectancy.htm",
    emoji: "⏳"
  },
  gdp_per_capita: {
    displayName: "GDP per Capita",
    defaultValue: 75000,
    unitName: "USD/year",
    description: "Annual gross domestic product per person in the United States",
    sourceUrl: "https://www.bea.gov/data/gdp/gross-domestic-product",
    emoji: "💰"
  },
  workforce_participation: {
    displayName: "Workforce Participation Rate",
    defaultValue: 0.62,
    unitName: "ratio",
    description: "Proportion of population participating in the workforce",
    sourceUrl: "https://www.bls.gov/charts/employment-situation/civilian-labor-force-participation-rate.htm",
    emoji: "👷"
  },
  medicare_spending: {
    displayName: "Medicare Spending per Beneficiary",
    defaultValue: 12000,
    unitName: "USD/year",
    description: "Annual Medicare spending per beneficiary",
    sourceUrl: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet",
    emoji: "🏥"
  },
  medicare_total_annual_spend: {
    displayName: "Total Medicare Annual Spend",
    defaultValue: 829000000000,
    unitName: "USD/year",
    description: "Total annual Medicare spending in the United States",
    sourceUrl: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet",
    emoji: "💉"
  },
  discount_rate: {
    displayName: "Discount Rate",
    defaultValue: 0.03,
    unitName: "ratio",
    description: "Annual discount rate for future economic benefits",
    sourceUrl: "https://www.whitehouse.gov/cea/written-materials/2024/02/27/valuing-the-future-revision-to-the-social-discount-rate-means-appropriately-assessing-benefits-and-costs/",
    emoji: "📊"
  }
};
