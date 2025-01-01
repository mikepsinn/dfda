// lib/health-econ-simulation/health-econ-simulation-gemini.ts

import { getSearchResultsByTopic } from '../agents/researcher/researcher';
import { z } from 'zod';
import { generateObject } from 'ai';
import { getModelByName } from "../../lib/utils/modelUtils";

const HealthcareCostSavingsSchema = z.object({
  reducedSpending: z.number().describe("Reduced spending on disease treatment and management."),
  medicareExpenditures: z.number().describe("Changes in Medicare expenditures."),
  medicaidExpenditures: z.number().describe("Changes in Medicaid expenditures."),
});

const PopulationLevelBenefitSchema = z.object({
  casesPrevented: z.number().describe("Number of cases prevented (e.g., Alzheimer’s, obesity-related conditions)."),
  mortalityRates: z.number().describe("Changes in mortality rates."),
  lifeYearsGained: z.number().describe("Life years gained (LYG)."),
  lyg: z.number().optional().describe("Life years gained (LYG)."),
});

const QualityOfLifeSchema = z.object({
  qaly: z.number().describe("Quality-adjusted life years (QALYs) or similar metrics."),
  hrqol: z.number().describe("Health-Related Quality of Life (HRQoL) scores, if available."),
});

const ProductivityImpactSchema = z.object({
  gdpGains: z.number().describe("GDP gains from extended working years."),
  extendedWorkingYears: z.number().describe("GDP gains from extended working years."),
  reducedAbsenteeism: z.number().describe("Reduced absenteeism."),
  disability: z.number().describe("Reduced disability."),
});

const CostEffectivenessRatiosSchema = z.object({
  icer: z.number().describe("Incremental cost-effectiveness ratio (ICER)."),
  roi: z.number().describe("Return on investment (ROI) estimates."),
});

const BudgetImpactSchema = z.object({
  upfrontCosts: z.number().describe("Upfront costs of intervention (research, manufacturing, distribution)."),
  longTermSavings: z.number().describe("Long-term savings or costs over a defined time horizon (5–10 years or longer)."),
  timeHorizon: z.string().optional().describe("Long-term savings or costs over a defined time horizon (5–10 years or longer)."),
});

const SensitivityAndScenarioAnalysesSchema = z.object({
    bestCase: z.number().describe("Best-case cost assumptions."),
    worstCase: z.number().describe("Worst-case cost assumptions."),
    costAssumptions: z.number().describe("Cost assumptions."),
    uptakeRates: z.number().describe("Uptake rates."),
    adherenceVariations: z.number().describe("Adherence variations."),
});

const SubPopulationAnalysisSchema = z.object({
    ageGroup: z.number().describe("Differences by age group."),
    comorbidities: z.number().describe("Differences by comorbidities."),
    socioeconomicStatus: z.number().describe("Differences by socioeconomic status."),
});


export class HealthEconSimulationGemini {
  async generateOutputs() {
    const outputs = [
      "Healthcare Cost Savings",
      "Population-Level Benefit",
      "Quality of Life",
      "Productivity Impact",
      "Cost-Effectiveness Ratios",
      "Budget Impact",
      "Sensitivity and Scenario Analyses",
      "Sub-Population Analysis",
    ];

    for (const output of outputs) {
      console.log(`Generating output for: ${output}`);
      const searchResults = await this.searchData(output);
      const structuredData = await this.generateOutputData(searchResults, output);
      const calculatedOutput = this.calculateOutput(output, structuredData);
      console.log(`Output for ${output}:`, calculatedOutput);
    }
  }

  async searchData(topic: string) {
    const numberOfSearchQueryVariations = 3;
    const numberOfWebResultsToInclude = 5;
    const searchResults = await getSearchResultsByTopic(
      topic,
      numberOfSearchQueryVariations,
      numberOfWebResultsToInclude
    );
    return searchResults;
  }

  async generateOutputData(searchResults: any, output: string) {
    console.log(`Generating object for output: ${output}`, searchResults);
    if (output === "Healthcare Cost Savings") {
      return this.generateHealthcareCostSavings(searchResults);
    } else if (output === "Population-Level Benefit") {
      return this.generatePopulationLevelBenefit(searchResults);
    } else if (output === "Quality of Life") {
      return this.generateQualityOfLife(searchResults);
    } else if (output === "Productivity Impact") {
      return this.generateProductivityImpact(searchResults);
    } else if (output === "Cost-Effectiveness Ratios") {
      return this.generateCostEffectivenessRatios(searchResults);
    } else if (output === "Budget Impact") {
      return this.generateBudgetImpact(searchResults);
    } else if (output === "Sensitivity and Scenario Analyses") {
      return this.generateSensitivityAndScenarioAnalyses(searchResults);
    } else if (output === "Sub-Population Analysis") {
      return this.generateSubPopulationAnalysis(searchResults);
    }
    return {};
  }

  async generateHealthcareCostSavings(searchResults: any) {
    const model =  getModelByName('gpt-4')
    const inputData = searchResults
    .map(
      (item: any) => `--START ITEM: ${item.title}--\n
    TITLE: ${item.title}\n
    URL: ${item.url}\n
    CONTENT: ${item.text}\n
    --END ITEM: ${item.title}--\n`
    )
    .join("")
    const prompt = `
    Extract the relevant data from the following search results and return it as a JSON object that matches the following schema:
    ${JSON.stringify(HealthcareCostSavingsSchema.parse({}), null, 2)}
    
    # Web Search Results
    Here is a list of web pages and excerpts from them that you can use to write the report:
    ${inputData}
    `
    const result = await generateObject({
        model: model,
        schema: HealthcareCostSavingsSchema,
        prompt,
        experimental_telemetry: { isEnabled: true },
      })
    return result.object
  }

  async generatePopulationLevelBenefit(searchResults: any) {
    const model =  getModelByName('gpt-4')
    const inputData = searchResults
    .map(
      (item: any) => `--START ITEM: ${item.title}--\n
    TITLE: ${item.title}\n
    URL: ${item.url}\n
    CONTENT: ${item.text}\n
    --END ITEM: ${item.title}--\n`
    )
    .join("")
    const prompt = `
    Extract the relevant data from the following search results and return it as a JSON object that matches the following schema:
    ${JSON.stringify(PopulationLevelBenefitSchema.parse({}), null, 2)}
    
    # Web Search Results
    Here is a list of web pages and excerpts from them that you can use to write the report:
    ${inputData}
    `
    const result = await generateObject({
        model: model,
        schema: PopulationLevelBenefitSchema,
        prompt,
        experimental_telemetry: { isEnabled: true },
      })
    return result.object
  }

  async generateQualityOfLife(searchResults: any) {
    const model =  getModelByName('gpt-4')
    const inputData = searchResults
    .map(
      (item: any) => `--START ITEM: ${item.title}--\n
    TITLE: ${item.title}\n
    URL: ${item.url}\n
    CONTENT: ${item.text}\n
    --END ITEM: ${item.title}--\n`
    )
    .join("")
    const prompt = `
    Extract the relevant data from the following search results and return it as a JSON object that matches the following schema:
    ${JSON.stringify(QualityOfLifeSchema.parse({}), null, 2)}
    
    # Web Search Results
    Here is a list of web pages and excerpts from them that you can use to write the report:
    ${inputData}
    `
    const result = await generateObject({
        model: model,
        schema: QualityOfLifeSchema,
        prompt,
        experimental_telemetry: { isEnabled: true },
      })
    return result.object
  }

  async generateProductivityImpact(searchResults: any) {
    const model =  getModelByName('gpt-4')
    const inputData = searchResults
    .map(
      (item: any) => `--START ITEM: ${item.title}--\n
    TITLE: ${item.title}\n
    URL: ${item.url}\n
    CONTENT: ${item.text}\n
    --END ITEM: ${item.title}--\n`
    )
    .join("")
    const prompt = `
    Extract the relevant data from the following search results and return it as a JSON object that matches the following schema:
    ${JSON.stringify(ProductivityImpactSchema.parse({}), null, 2)}
    
    # Web Search Results
    Here is a list of web pages and excerpts from them that you can use to write the report:
    ${inputData}
    `
    const result = await generateObject({
        model: model,
        schema: ProductivityImpactSchema,
        prompt,
        experimental_telemetry: { isEnabled: true },
      })
    return result.object
  }

  async generateCostEffectivenessRatios(searchResults: any) {
    const model =  getModelByName('gpt-4')
    const inputData = searchResults
    .map(
      (item: any) => `--START ITEM: ${item.title}--\n
    TITLE: ${item.title}\n
    URL: ${item.url}\n
    CONTENT: ${item.text}\n
    --END ITEM: ${item.title}--\n`
    )
    .join("")
    const prompt = `
    Extract the relevant data from the following search results and return it as a JSON object that matches the following schema:
    ${JSON.stringify(CostEffectivenessRatiosSchema.parse({}), null, 2)}
    
    # Web Search Results
    Here is a list of web pages and excerpts from them that you can use to write the report:
    ${inputData}
    `
    const result = await generateObject({
        model: model,
        schema: CostEffectivenessRatiosSchema,
        prompt,
        experimental_telemetry: { isEnabled: true },
      })
    return result.object
  }

    async generateBudgetImpact(searchResults: any) {
    const model =  getModelByName('gpt-4')
    const inputData = searchResults
    .map(
      (item: any) => `--START ITEM: ${item.title}--\n
    TITLE: ${item.title}\n
    URL: ${item.url}\n
    CONTENT: ${item.text}\n
    --END ITEM: ${item.title}--\n`
    )
    .join("")
    const prompt = `
    Extract the relevant data from the following search results and return it as a JSON object that matches the following schema:
    ${JSON.stringify(BudgetImpactSchema.parse({}), null, 2)}
    
    # Web Search Results
    Here is a list of web pages and excerpts from them that you can use to write the report:
    ${inputData}
    `
    const result = await generateObject({
        model: model,
        schema: BudgetImpactSchema,
        prompt,
        experimental_telemetry: { isEnabled: true },
      })
    return result.object
  }

  async generateSensitivityAndScenarioAnalyses(searchResults: any) {
    const model =  getModelByName('gpt-4')
    const inputData = searchResults
    .map(
      (item: any) => `--START ITEM: ${item.title}--\n
    TITLE: ${item.title}\n
    URL: ${item.url}\n
    CONTENT: ${item.text}\n
    --END ITEM: ${item.title}--\n`
    )
    .join("")
    const prompt = `
    Extract the relevant data from the following search results and return it as a JSON object that matches the following schema:
    ${JSON.stringify(SensitivityAndScenarioAnalysesSchema.parse({}), null, 2)}
    
    # Web Search Results
    Here is a list of web pages and excerpts from them that you can use to write the report:
    ${inputData}
    `
    const result = await generateObject({
        model: model,
        schema: SensitivityAndScenarioAnalysesSchema,
        prompt,
        experimental_telemetry: { isEnabled: true },
      })
    return result.object
  }

  async generateSubPopulationAnalysis(searchResults: any) {
    const model =  getModelByName('gpt-4')
    const inputData = searchResults
    .map(
      (item: any) => `--START ITEM: ${item.title}--\n
    TITLE: ${item.title}\n
    URL: ${item.url}\n
    CONTENT: ${item.text}\n
    --END ITEM: ${item.title}--\n`
    )
    .join("")
    const prompt = `
    Extract the relevant data from the following search results and return it as a JSON object that matches the following schema:
    ${JSON.stringify(SubPopulationAnalysisSchema.parse({}), null, 2)}
    
    # Web Search Results
    Here is a list of web pages and excerpts from them that you can use to write the report:
    ${inputData}
    `
    const result = await generateObject({
        model: model,
        schema: SubPopulationAnalysisSchema,
        prompt,
        experimental_telemetry: { isEnabled: true },
      })
    return result.object
  }


  calculateOutput(output: string, data: any) {
    // TODO: Implement calculations to produce the final output
    console.log('calculateOutput not implemented yet', output, data);
    return {};
  }
}

const healthEconSim = new HealthEconSimulationGemini();
healthEconSim.generateOutputs();
