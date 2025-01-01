import { LanguageModelV1 } from "@ai-sdk/provider";
import { z } from "zod";
import { generateObject } from "ai";
import { SearchResult } from "exa-js";
import { getSearchResultsByTopic } from "@/lib/agents/researcher/researcher";
import { getModelByName, ModelName, DEFAULT_MODEL_NAME } from "@/lib/utils/modelUtils";

// Core types for health economics simulation
export interface HealthEconMetric {
  value: number;
  unit: string;
  confidence: number; // 0-1 scale
  sources: SearchResult[];
}

export interface CostMetric extends HealthEconMetric {
  timeframe: string; // e.g., "annual", "5-year", "lifetime"
  discountRate?: number;
}

export interface QualityMetric extends HealthEconMetric {
  population: string;
  baseline: number;
}

// Schema for extracting structured data from search results
const HealthEconDataSchema = z.object({
  healthcareCosts: z.object({
    directMedicalCosts: z.number(),
    medicareMedicaidExpenditures: z.number(),
    timeframe: z.string(),
    currency: z.string(),
  }),
  
  populationBenefit: z.object({
    casesPrevented: z.number(),
    mortalityRateChange: z.number(),
    lifeYearsGained: z.number(),
  }),

  qualityOfLife: z.object({
    qalyGained: z.number(),
    hrqolScoreChange: z.number(),
  }),

  productivity: z.object({
    gdpGains: z.number(),
    reducedAbsenteeismDays: z.number(),
    currency: z.string(),
  }),

  costEffectiveness: z.object({
    icer: z.number(),
    roi: z.number(),
  }),

  budgetImpact: z.object({
    upfrontCosts: z.number(),
    annualCosts: z.number(),
    currency: z.string(),
  }),
});

export type HealthEconData = z.infer<typeof HealthEconDataSchema>;

export interface SimulationOptions {
  intervention: string;
  population: string;
  timeHorizon: number; // years
  discountRate: number;
  modelName?: ModelName;
  numberOfSearchResults?: number;
}

export class HealthEconSimulation {
  private model: LanguageModelV1;
  private searchResults: SearchResult[] = [];
  private options: SimulationOptions;

  constructor(options: SimulationOptions) {
    this.options = {
      numberOfSearchResults: 20,
      modelName: DEFAULT_MODEL_NAME,
      ...options,
    };
    this.model = getModelByName(this.options.modelName);
  }

  async gatherData(): Promise<void> {
    const searchQueries = [
      `${this.options.intervention} health economic evaluation`,
      `${this.options.intervention} cost effectiveness analysis`,
      `${this.options.intervention} QALY gains`,
      `${this.options.intervention} healthcare costs savings`,
      `${this.options.intervention} productivity impact`,
    ];

    for (const query of searchQueries) {
      const results = await getSearchResultsByTopic(
        query,
        1,
        Math.ceil(this.options.numberOfSearchResults! / searchQueries.length)
      );
      this.searchResults.push(...results);
    }
  }

  private async extractStructuredData(): Promise<HealthEconData> {
    const inputData = this.searchResults
      .map(
        (item) => `
        SOURCE: ${item.url}
        TITLE: ${item.title}
        CONTENT: ${item.text}
        `
      )
      .join("\n");

    const prompt = `
      Extract structured quantitative data about the health economic impact of "${this.options.intervention}" 
      for the population: "${this.options.population}" over a ${this.options.timeHorizon} year time horizon.
      
      Use the following sources to extract or estimate the required values. 
      If exact values aren't available, provide reasonable estimates based on similar interventions or populations.
      All monetary values should be in current USD.
      
      Sources:
      ${inputData}
    `;

    const result = await generateObject({
      model: this.model,
      schema: HealthEconDataSchema,
      prompt,
    });

    return result.object as HealthEconData;
  }

  private calculateDiscountedValue(value: number, years: number): number {
    return value / Math.pow(1 + this.options.discountRate, years);
  }

  async simulate() {
    await this.gatherData();
    const data = await this.extractStructuredData();

    return {
      healthcareCostSavings: {
        value: this.calculateDiscountedValue(
          data.healthcareCosts.directMedicalCosts,
          this.options.timeHorizon
        ),
        unit: data.healthcareCosts.currency,
        timeframe: data.healthcareCosts.timeframe,
        discountRate: this.options.discountRate,
      },

      populationBenefit: {
        casesPrevented: {
          value: data.populationBenefit.casesPrevented,
          unit: "cases",
        },
        mortalityReduction: {
          value: data.populationBenefit.mortalityRateChange,
          unit: "percentage",
        },
        lifeYearsGained: {
          value: data.populationBenefit.lifeYearsGained,
          unit: "years",
        },
      },

      qualityOfLife: {
        qalyGained: {
          value: data.qualityOfLife.qalyGained,
          unit: "QALYs",
        },
        hrqolImprovement: {
          value: data.qualityOfLife.hrqolScoreChange,
          unit: "score change",
        },
      },

      productivity: {
        gdpGains: {
          value: this.calculateDiscountedValue(
            data.productivity.gdpGains,
            this.options.timeHorizon
          ),
          unit: data.productivity.currency,
        },
        reducedAbsenteeism: {
          value: data.productivity.reducedAbsenteeismDays,
          unit: "days per year",
        },
      },

      costEffectiveness: {
        icer: {
          value: data.costEffectiveness.icer,
          unit: `${data.healthcareCosts.currency}/QALY`,
        },
        roi: {
          value: data.costEffectiveness.roi,
          unit: "ratio",
        },
      },

      budgetImpact: {
        upfrontCosts: {
          value: data.budgetImpact.upfrontCosts,
          unit: data.budgetImpact.currency,
        },
        annualCosts: {
          value: this.calculateDiscountedValue(
            data.budgetImpact.annualCosts,
            this.options.timeHorizon
          ),
          unit: data.budgetImpact.currency,
          timeframe: "annual",
        },
      },

      metadata: {
        intervention: this.options.intervention,
        population: this.options.population,
        timeHorizon: this.options.timeHorizon,
        discountRate: this.options.discountRate,
        sourcesUsed: this.searchResults.length,
      },
    };
  }
}

// Example usage:
/*
const simulation = new HealthEconSimulation({
  intervention: "Early Alzheimer's Detection Program",
  population: "US Adults over 65",
  timeHorizon: 10,
  discountRate: 0.03,
});

const results = await simulation.simulate();
*/
