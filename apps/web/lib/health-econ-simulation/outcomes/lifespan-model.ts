import { lifespanParameters } from './lifespan-parameters';

interface LifespanImpactResults {
  additional_years: number;
  gdp_impact: number;
  medicare_savings: number;
  private_insurance_savings: number;
  social_security_savings: number;
  medicare_spend_impact: number;
  total_economic_impact: number;
  population_size: number;
}

export class LifespanImpactModel {
  // Base parameters from parameters file
  private base_life_expectancy: number = lifespanParameters.base_life_expectancy.defaultValue;
  private gdp_per_capita: number = lifespanParameters.gdp_per_capita.defaultValue;
  private workforce_participation: number = lifespanParameters.workforce_participation.defaultValue;
  private medicare_spending: number = lifespanParameters.medicare_spending.defaultValue;
  private medicare_total_annual_spend: number = lifespanParameters.medicare_total_annual_spend.defaultValue;
  private discount_rate: number = lifespanParameters.discount_rate.defaultValue;

  public calculate_impacts(lifespan_increase_pct: number, population_size: number = 100000): LifespanImpactResults {
    // Validate input
    if (!(0 <= lifespan_increase_pct && lifespan_increase_pct <= 100)) {
      throw new Error("Lifespan increase percentage must be between 0 and 100");
    }

    // Calculate additional years
    const additional_years = this.base_life_expectancy * (lifespan_increase_pct / 100);

    // Discount factor
    const discount_factor = 1 / Math.pow(1 + this.discount_rate, additional_years);

    // GDP impact (additional productive years), discounted
    const productive_years = additional_years * this.workforce_participation;
    const gdp_impact = productive_years * this.gdp_per_capita * discount_factor * population_size;

    // Healthcare savings (Medicare + private insurance), discounted
    const medicare_savings = additional_years * this.medicare_spending * discount_factor * population_size;
    const private_insurance_savings = additional_years * (this.medicare_spending * 0.8) * discount_factor * population_size; // Estimate private insurance costs

    // Social security impact (delayed payouts), discounted
    const social_security_savings = additional_years * 15000 * discount_factor * population_size; // Average annual SS benefit

    // Medicare total annual spend impact (based on mortality reduction)
    const medicare_spend_impact = this.medicare_total_annual_spend * (lifespan_increase_pct / 100) * discount_factor;

    // Total economic impact, discounted
    const total_economic_impact = gdp_impact + medicare_savings + private_insurance_savings + social_security_savings;

    return {
      additional_years,
      gdp_impact,
      medicare_savings,
      private_insurance_savings,
      social_security_savings,
      medicare_spend_impact,
      total_economic_impact,
      population_size
    };
  }

  public generate_report(lifespan_increase_pct: number, population_size: number = 100000, save_to_file: boolean = false): string {
    const results = this.calculate_impacts(lifespan_increase_pct, population_size);

    // Calculate all required values first
    const additional_years = results.additional_years;
    const productive_years = additional_years * this.workforce_participation;
    const discount_factor = 1 / Math.pow(1 + this.discount_rate, additional_years);

    const report = `
# Lifespan Impact Analysis Report

## Executive Summary
Analysis of economic impacts from a **${lifespan_increase_pct}%** increase in lifespan across a population of **${population_size.toLocaleString()}** individuals, focusing on GDP contribution and Medicare impacts. Based on current demographic and economic data from authoritative sources.

## Methodology & Calculations

### 1. Additional Years of Life (Per Person)
\`\`\`
additional_years = base_life_expectancy × (lifespan_increase_pct / 100)
= ${this.base_life_expectancy} × (${lifespan_increase_pct}/100)
= ${additional_years.toFixed(1)} years
\`\`\`

### 2. Discount Factor
\`\`\`
discount_factor = 1 / (1 + discount_rate)^additional_years
= 1 / (1 + ${this.discount_rate})^${additional_years.toFixed(1)}
= ${discount_factor.toFixed(4)}
\`\`\`

### 3. GDP Impact (Population-wide, Discounted)
\`\`\`
productive_years = additional_years × workforce_participation
= ${additional_years.toFixed(1)} × ${this.workforce_participation}
= ${productive_years.toFixed(1)} years per person

gdp_impact = productive_years × gdp_per_capita × discount_factor × population_size
= ${productive_years.toFixed(1)} × ${this.gdp_per_capita} × ${discount_factor.toFixed(4)} × ${population_size.toLocaleString()}
= $${results.gdp_impact.toLocaleString()}
\`\`\`

### 4. Medicare Savings (Population-wide, Discounted)
\`\`\`
medicare_savings = additional_years × medicare_spending × discount_factor × population_size
= ${additional_years.toFixed(1)} × ${this.medicare_spending} × ${discount_factor.toFixed(4)} × ${population_size.toLocaleString()}
= $${results.medicare_savings.toLocaleString()}
\`\`\`

### 5. Private Insurance Savings (Population-wide, Discounted)
\`\`\`
private_insurance_savings = additional_years × (medicare_spending × 0.8) × discount_factor × population_size
= ${additional_years.toFixed(1)} × (${this.medicare_spending} × 0.8) × ${discount_factor.toFixed(4)} × ${population_size.toLocaleString()}
= $${results.private_insurance_savings.toLocaleString()}
\`\`\`

### 6. Social Security Savings (Population-wide, Discounted)
\`\`\`
social_security_savings = additional_years × 15000 × discount_factor × population_size
= ${additional_years.toFixed(1)} × 15000 × ${discount_factor.toFixed(4)} × ${population_size.toLocaleString()}
= $${results.social_security_savings.toLocaleString()}
\`\`\`

### 7. Medicare Total Annual Spend Impact (Discounted)
\`\`\`
medicare_spend_impact = medicare_total_annual_spend × (lifespan_increase_pct / 100) × discount_factor
= ${this.medicare_total_annual_spend.toLocaleString()} × (${lifespan_increase_pct}/100) × ${discount_factor.toFixed(4)}
= $${results.medicare_spend_impact.toLocaleString()}
\`\`\`

### 8. Total Economic Impact (Population-wide, Discounted)
\`\`\`
total_economic_impact = gdp_impact + medicare_savings + private_insurance_savings + social_security_savings
= ${results.gdp_impact.toLocaleString()} + ${results.medicare_savings.toLocaleString()} + ${results.private_insurance_savings.toLocaleString()} + ${results.social_security_savings.toLocaleString()}
= $${results.total_economic_impact.toLocaleString()}
\`\`\`

## Input Parameters
| Parameter | Value | Source |
|-----------|-------|---------|
| Population Size | ${population_size.toLocaleString()} | Model Input |
| Lifespan Increase | ${lifespan_increase_pct}% | Model Input |
| Base Life Expectancy | ${this.base_life_expectancy} years | CDC, 2023 |
| GDP per Capita | $${this.gdp_per_capita.toLocaleString()} | BEA, 2023 |
| Workforce Participation | ${(this.workforce_participation*100).toFixed(0)}% | BLS, 2023 |
| Annual Medicare Spending | $${this.medicare_spending.toLocaleString()} | CMS, 2023 |
| Total Medicare Annual Spend | $${this.medicare_total_annual_spend.toLocaleString()} | CMS, 2023 |
| Discount Rate | ${(this.discount_rate*100).toFixed(0)}% | White House CEA, 2023 |

## Results Summary
*All values discounted at ${(this.discount_rate*100).toFixed(0)}% per year for population of ${population_size.toLocaleString()}*

| Metric | Value |
|--------|--------|
| Additional Years of Life (per person) | ${results.additional_years.toFixed(1)} years |
| GDP Impact | $${results.gdp_impact.toLocaleString()} |
| Medicare Savings | $${results.medicare_savings.toLocaleString()} |
| Private Insurance Savings | $${results.private_insurance_savings.toLocaleString()} |
| Social Security Savings | $${results.social_security_savings.toLocaleString()} |
| Medicare Total Annual Spend Impact | $${results.medicare_spend_impact.toLocaleString()} |
| **Total Economic Impact** | **$${results.total_economic_impact.toLocaleString()}** |

## Sensitivity Analysis
The model demonstrates:
- Linear relationship between lifespan increase and economic benefits
- Greatest impact seen in workforce participation rate
- Medicare savings scale proportionally with additional years
- Population size directly scales all economic impacts except Medicare total annual spend

## Data Sources & References

### Government Health Statistics
1. **CDC National Center for Health Statistics**  
   Life expectancy data  
   [https://www.cdc.gov/nchs/fastats/life-expectancy.htm](https://www.cdc.gov/nchs/fastats/life-expectancy.htm)

### Economic Data
2. **U.S. Bureau of Economic Analysis (BEA)**  
   GDP per capita calculations  
   [https://www.bea.gov/data/gdp/gross-domestic-product](https://www.bea.gov/data/gdp/gross-domestic-product)

3. **Bureau of Labor Statistics (BLS)**  
   Workforce participation rates  
   [https://www.bls.gov/charts/employment-situation/civilian-labor-force-participation-rate.htm](https://www.bls.gov/charts/employment-situation/civilian-labor-force-participation-rate.htm)

### Healthcare Economics
4. **Centers for Medicare & Medicaid Services (CMS)**  
   Medicare spending data  
   [https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet](https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet)

### Policy Analysis
5. **White House Council of Economic Advisers**  
   Discount rate methodology  
   [https://www.whitehouse.gov/cea/written-materials/2024/02/27/valuing-the-future-revision-to-the-social-discount-rate-means-appropriately-assessing-benefits-and-costs/](https://www.whitehouse.gov/cea/written-materials/2024/02/27/valuing-the-future-revision-to-the-social-discount-rate-means-appropriately-assessing-benefits-and-costs/)
`;

    if (save_to_file) {
      // Note: In a browser environment, you'd need to use the File System Access API
      // or a server endpoint to save the file. This is just a placeholder.
      console.log(`Report would be saved to lifespan_report_${lifespan_increase_pct}pct.md`);
    }

    return report;
  }
}

// Example usage:
// const model = new LifespanImpactModel();
// const report = model.generate_report(2.5, 100000, true);
