import { z } from "zod";
import { InterventionEffects } from "./intervention-effects";

export const EconomicImpactSchema = z.object({
  healthcare: z.object({
    directCostSavings: z.number().describe("Annual healthcare cost savings in USD"),
    medicareMedicaidSavings: z.number().describe("Annual Medicare/Medicaid savings in USD"),
    preventiveCare: z.number().describe("Cost of preventive care and monitoring in USD"),
    qualityOfCare: z.number().describe("Impact on healthcare quality metrics (0-1 scale)"),
  }).describe("Healthcare system financial impacts"),

  productivity: z.object({
    gdpGain: z.number().describe("Annual GDP gain from increased productivity in USD"),
    workforceParticipation: z.number().describe("Change in workforce participation rate"),
    absenteeismReduction: z.number().describe("Reduction in sick days per worker per year"),
    disabilityReduction: z.number().describe("Reduction in disability claims per 1000 workers"),
  }).describe("Workforce and productivity impacts"),

  qualityOfLife: z.object({
    qalyGained: z.number().describe("Quality-adjusted life years gained per person"),
    monetaryValueQaly: z.number().describe("Monetary value of QALY gains in USD"),
    disabilityAdjustment: z.number().describe("Change in disability-adjusted life years"),
  }).describe("Quality of life and well-being impacts"),

  societalImpact: z.object({
    educationalOutcomes: z.number().optional().describe("Impact on educational achievement"),
    criminalJustice: z.number().optional().describe("Reduction in criminal justice costs"),
    socialServices: z.number().optional().describe("Change in social service utilization"),
  }).describe("Broader societal impacts"),

  timeHorizon: z.object({
    shortTerm: z.number().describe("1-year impact in USD"),
    mediumTerm: z.number().describe("5-year impact in USD"),
    longTerm: z.number().describe("Lifetime impact in USD"),
  }).describe("Time-based financial projections"),
}).describe("Comprehensive economic impact assessment");

export type EconomicImpact = z.infer<typeof EconomicImpactSchema>;

export interface ImpactCalculationOptions {
  discountRate: number;
  populationSize: number;
  timeHorizon: number;
  monetaryYear: number; // Year for monetary values (for inflation adjustment)
  region: string; // Geographic region for calculations
}

export class EconomicImpactCalculator {
  private static readonly DEFAULT_OPTIONS: ImpactCalculationOptions = {
    discountRate: 0.03,
    populationSize: 331900000, // US population
    timeHorizon: 10,
    monetaryYear: 2023,
    region: "United States",
  };

  static async calculateImpact(
    effects: InterventionEffects,
    options: Partial<ImpactCalculationOptions> = {}
  ): Promise<EconomicImpact> {
    const fullOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    // This will be implemented to calculate economic impacts from intervention effects
    // It will use the parameter research engine to get missing economic multipliers
    throw new Error("Not implemented yet");
  }

  private static calculateDiscountedValue(
    value: number,
    years: number,
    discountRate: number
  ): number {
    return value / Math.pow(1 + discountRate, years);
  }

  private static async getEconomicMultipliers(
    region: string,
    monetaryYear: number
  ): Promise<any> {
    // This will fetch region-specific economic multipliers
    // Like GDP per capita, healthcare costs, etc.
    throw new Error("Not implemented yet");
  }
} 