// lib/health-econ-simulation/health-econ-simulation-gemini.ts

import { getSearchResultsByTopic } from '../agents/researcher/researcher';
import { z } from 'zod';
import { generateObject } from 'ai';
import { getModelByName } from "'lib/utils/modelUtils'";

const HealthcareCostSavingsSchema = z.object({
  reducedSpending: z.array(z.string()).optional(),
  medicareExpenditures: z.array(z.string()).optional(),
  medicaidExpenditures: z.array(z.string()).optional(),
});

const PopulationLevelBenefitSchema = z.object({
  casesPrevented: z.array(z.string()).optional(),
  mortalityRates: z.array(z.string()).optional(),
  lifeYearsGained: z.array(z.string()).optional(),
  lyg: z.array(z.string()).optional(),
});

const QualityOfLifeSchema = z.object({
  qaly: z.array(z.string()).optional(),
  hrqol: z.array(z.string()).optional(),
});

const ProductivityImpactSchema = z.object({
  gdpGains: z.array(z.string()).optional(),
  extendedWorkingYears: z.array(z.string()).optional(),
  reducedAbsenteeism: z.array(z.string()).optional(),
  disability: z.array(z.string()).optional(),
});

const CostEffectivenessRatiosSchema = z.object({
  icer: z.array(z.string()).optional(),
  roi: z.array(z.string()).optional(),
});

const BudgetImpactSchema = z.object({
  upfrontCosts: z.array(z.string()).optional(),
  longTermSavings: z.array(z.string()).optional(),
  timeHorizon: z.array(z.string()).optional(),
});

const SensitivityAndScenarioAnalysesSchema = z.object({
    bestCase: z.array(z.string()).optional(),
    worstCase: z.array(z.string()).optional(),
    costAssumptions: z.array(z.string()).optional(),
    uptakeRates: z.array(z.string()).optional(),
    adherenceVariations: z.array(z.string()).optional(),
});

const SubPopulationAnalysisSchema = z.object({
    ageGroup: z.array(z.string()).optional(),
    comorbidities: z.array(z.string()).optional(),
    socioeconomicStatus: z.array(z.string()).optional(),
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
      return this.generateObjectWithSchema(searchResults, HealthcareCostSavingsSchema);
    } else if (output === "Population-Level Benefit") {
      return this.generateObjectWithSchema(searchResults, PopulationLevelBenefitSchema);
    } else if (output === "Quality of Life") {
      return this.generateObjectWithSchema(searchResults, QualityOfLifeSchema);
    } else if (output === "Productivity Impact") {
      return this.generateObjectWithSchema(searchResults, ProductivityImpactSchema);
    } else if (output === "Cost-Effectiveness Ratios") {
      return this.generateObjectWithSchema(searchResults, CostEffectivenessRatiosSchema);
    } else if (output === "Budget Impact") {
      return this.generateObjectWithSchema(searchResults, BudgetImpactSchema);
    } else if (output === "Sensitivity and Scenario Analyses") {
      return this.generateObjectWithSchema(searchResults, SensitivityAndScenarioAnalysesSchema);
    } else if (output === "Sub-Population Analysis") {
      return this.generateObjectWithSchema(searchResults, SubPopulationAnalysisSchema);
    }
    return {};
  }

  async generateObjectWithSchema(searchResults: any, schema: any) {
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
    ${JSON.stringify(schema.parse({}), null, 2)}
    
    # Web Search Results
    Here is a list of web pages and excerpts from them that you can use to write the report:
    ${inputData}
    `
    const result = await generateObject({
        model: model,
        schema: schema,
        prompt,
        experimental_telemetry: { isEnabled: true },
      })
    return result.object
  }

  async generateHealthcareCostSavings(searchResults: any) {
    return {};
  }

  async generatePopulationLevelBenefit(searchResults: any) {
    return {};
  }

  async generateQualityOfLife(searchResults: any) {
    return {};
  }

  async generateProductivityImpact(searchResults: any) {
    return {};
  }

  async generateCostEffectivenessRatios(searchResults: any) {
    return {};
  }

    async generateBudgetImpact(searchResults: any) {
    return {};
  }

  async generateSensitivityAndScenarioAnalyses(searchResults: any) {
    return {};
  }

  async generateSubPopulationAnalysis(searchResults: any) {
    return {};
  }


  calculateOutput(output: string, data: any) {
    // TODO: Implement calculations to produce the final output
    console.log('calculateOutput not implemented yet', output, data);
    return {};
  }
}

const healthEconSim = new HealthEconSimulationGemini();
healthEconSim.generateOutputs();
