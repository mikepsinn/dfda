import { z } from "zod";
import { InterventionEffects } from "./intervention-effects";
import { ParameterResearchEngine } from "./parameter-research";
import { generateObject } from "ai";
import { getModelByName, ModelName } from "@/lib/utils/modelUtils";
import { LanguageModelV1 } from "@ai-sdk/provider";

// Economic multipliers schema
const EconomicMultipliersSchema = z.object({
  healthcare: z.object({
    annualCostPerPerson: z.number().describe("Average annual healthcare cost per person in USD"),
    medicareMedicaidPercentage: z.number().describe("Percentage of healthcare costs paid by Medicare/Medicaid"),
    preventiveCareMultiplier: z.number().describe("Cost multiplier for preventive vs. acute care"),
  }),

  productivity: z.object({
    gdpPerCapita: z.number().describe("Annual GDP per capita in USD"),
    workdaysPerYear: z.number().describe("Average number of working days per year"),
    dailyProductivityValue: z.number().describe("Average daily productivity value per worker in USD"),
  }),

  qualityOfLife: z.object({
    qalyMonetaryValue: z.number().describe("Monetary value assigned to one QALY in USD"),
    dalyMonetaryValue: z.number().describe("Monetary value assigned to one DALY in USD"),
    lifeYearValue: z.number().describe("Value of one life year in USD"),
  }),

  disease: z.object({
    chronicDiseaseAnnualCost: z.number().describe("Average annual cost of chronic disease management"),
    acuteDiseaseEpisodeCost: z.number().describe("Average cost per acute disease episode"),
    disabilityCostMultiplier: z.number().describe("Cost multiplier for disability services"),
  }),
}).describe("Economic multipliers for impact calculations");

export type EconomicMultipliers = z.infer<typeof EconomicMultipliersSchema>;

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

  private parameterEngine: ParameterResearchEngine;
  private model: LanguageModelV1;

  constructor(parameterEngine: ParameterResearchEngine) {
    this.parameterEngine = parameterEngine;
    this.model = getModelByName();
  }

  async calculateImpact(
    effects: InterventionEffects,
    options: Partial<ImpactCalculationOptions> = {}
  ): Promise<EconomicImpact> {
    const fullOptions = { ...EconomicImpactCalculator.DEFAULT_OPTIONS, ...options };
    
    // Get economic multipliers for the region and year
    const multipliers = await this.getEconomicMultipliers(
      fullOptions.region,
      fullOptions.monetaryYear
    );

    // Calculate impacts by category
    const [healthcare, productivity, qualityOfLife, societal] = await Promise.all([
      this.calculateHealthcareImpact(effects, multipliers, fullOptions),
      this.calculateProductivityImpact(effects, multipliers, fullOptions),
      this.calculateQualityOfLifeImpact(effects, multipliers, fullOptions),
      this.calculateSocietalImpact(effects, multipliers, fullOptions),
    ]);

    // Calculate time-based projections
    const timeHorizon = this.calculateTimeHorizonImpacts(
      healthcare,
      productivity,
      qualityOfLife,
      societal,
      fullOptions
    );

    return {
      healthcare,
      productivity,
      qualityOfLife,
      societalImpact: societal,
      timeHorizon,
    };
  }

  private async getEconomicMultipliers(
    region: string,
    monetaryYear: number
  ): Promise<EconomicMultipliers> {
    // Research economic multipliers for the region
    const parameters = await this.parameterEngine.researchParameter(
      "economic multipliers",
      `healthcare and productivity metrics for ${region} in ${monetaryYear}`
    );

    const result = await generateObject({
      model: this.model,
      schema: EconomicMultipliersSchema,
      prompt: `
        Convert the following economic parameter estimates into multipliers:
        ${JSON.stringify(parameters, null, 2)}
        
        Consider:
        1. Healthcare costs and systems
        2. Workforce productivity
        3. Quality of life valuations
        4. Disease-specific costs
        
        For the region: ${region}
        Reference year: ${monetaryYear}
      `,
    });

    return result.object as EconomicMultipliers;
  }

  private async calculateHealthcareImpact(
    effects: InterventionEffects,
    multipliers: EconomicMultipliers,
    options: ImpactCalculationOptions
  ): Promise<EconomicImpact["healthcare"]> {
    let directCostSavings = 0;
    let medicareMedicaidSavings = 0;
    let preventiveCare = 0;
    let qualityOfCare = 0;

    // Calculate from physical health effects
    if (effects.physicalHealth) {
      if (effects.physicalHealth.diseaseProgression) {
        const progression = effects.physicalHealth.diseaseProgression;
        directCostSavings += this.calculateDiseaseCostSavings(
          progression,
          multipliers.disease
        );
      }

      if (effects.physicalHealth.mortality) {
        const mortality = effects.physicalHealth.mortality;
        directCostSavings += this.calculateMortalityRelatedSavings(
          mortality,
          multipliers.healthcare
        );
      }
    }

    // Calculate from healthcare utilization
    if (effects.healthcareUtilization) {
      const utilization = effects.healthcareUtilization;
      
      if (utilization.hospitalizations) {
        directCostSavings += this.calculateHospitalizationSavings(
          utilization.hospitalizations,
          multipliers.healthcare
        );
      }

      if (utilization.medicationUse) {
        directCostSavings += this.calculateMedicationSavings(
          utilization.medicationUse,
          multipliers.healthcare
        );
      }
    }

    // Apply Medicare/Medicaid percentage
    medicareMedicaidSavings = directCostSavings * multipliers.healthcare.medicareMedicaidPercentage;

    return {
      directCostSavings,
      medicareMedicaidSavings,
      preventiveCare,
      qualityOfCare,
    };
  }

  private async calculateProductivityImpact(
    effects: InterventionEffects,
    multipliers: EconomicMultipliers,
    options: ImpactCalculationOptions
  ): Promise<EconomicImpact["productivity"]> {
    let gdpGain = 0;
    let workforceParticipation = 0;
    let absenteeismReduction = 0;
    let disabilityReduction = 0;

    // Calculate from physical health effects
    if (effects.physicalHealth?.functionalStatus) {
      const functional = effects.physicalHealth.functionalStatus;
      
      if (functional.mobilityChange) {
        gdpGain += this.calculateMobilityProductivityGain(
          functional.mobilityChange,
          multipliers.productivity
        );
      }

      if (functional.adlIndependence) {
        workforceParticipation += this.calculateIndependenceEffect(
          functional.adlIndependence,
          multipliers.productivity
        );
      }
    }

    // Calculate from cognitive effects
    if (effects.cognitiveHealth?.intelligence) {
      const intelligence = effects.cognitiveHealth.intelligence;
      
      if (intelligence.iqChange) {
        gdpGain += this.calculateIQProductivityGain(
          intelligence.iqChange,
          multipliers.productivity
        );
      }
    }

    return {
      gdpGain,
      workforceParticipation,
      absenteeismReduction,
      disabilityReduction,
    };
  }

  private async calculateQualityOfLifeImpact(
    effects: InterventionEffects,
    multipliers: EconomicMultipliers,
    options: ImpactCalculationOptions
  ): Promise<EconomicImpact["qualityOfLife"]> {
    let qalyGained = 0;
    let monetaryValueQaly = 0;
    let disabilityAdjustment = 0;

    // Calculate from mortality effects
    if (effects.physicalHealth?.mortality) {
      const mortality = effects.physicalHealth.mortality;
      
      if (mortality.qualityAdjustedLifeYears) {
        qalyGained += mortality.qualityAdjustedLifeYears.value;
      }

      if (mortality.disabilityAdjustedLifeYears) {
        disabilityAdjustment += mortality.disabilityAdjustedLifeYears.value;
      }
    }

    // Calculate monetary value
    monetaryValueQaly = qalyGained * multipliers.qualityOfLife.qalyMonetaryValue;

    return {
      qalyGained,
      monetaryValueQaly,
      disabilityAdjustment,
    };
  }

  private async calculateSocietalImpact(
    effects: InterventionEffects,
    multipliers: EconomicMultipliers,
    options: ImpactCalculationOptions
  ): Promise<EconomicImpact["societalImpact"]> {
    let educationalOutcomes = 0;
    let criminalJustice = 0;
    let socialServices = 0;

    // Calculate from cognitive effects
    if (effects.cognitiveHealth?.intelligence) {
      const intelligence = effects.cognitiveHealth.intelligence;
      
      if (intelligence.iqChange) {
        educationalOutcomes = this.calculateIQEducationEffect(
          intelligence.iqChange,
          multipliers
        );
      }
    }

    // Calculate from public health effects
    if (effects.publicHealth?.healthDisparities) {
      const disparities = effects.publicHealth.healthDisparities;
      
      if (disparities.accessGap) {
        socialServices = this.calculateDisparitiesEffect(
          disparities.accessGap,
          multipliers
        );
      }
    }

    return {
      educationalOutcomes,
      criminalJustice,
      socialServices,
    };
  }

  private calculateTimeHorizonImpacts(
    healthcare: EconomicImpact["healthcare"],
    productivity: EconomicImpact["productivity"],
    qualityOfLife: EconomicImpact["qualityOfLife"],
    societal: EconomicImpact["societalImpact"],
    options: ImpactCalculationOptions
  ): EconomicImpact["timeHorizon"] {
    const annualImpact =
      healthcare.directCostSavings +
      productivity.gdpGain +
      qualityOfLife.monetaryValueQaly +
      (societal.educationalOutcomes || 0);

    return {
      shortTerm: this.calculateDiscountedValue(annualImpact, 1, options.discountRate),
      mediumTerm: this.calculateDiscountedValue(annualImpact * 5, 5, options.discountRate),
      longTerm: this.calculateDiscountedValue(
        annualImpact * options.timeHorizon,
        options.timeHorizon,
        options.discountRate
      ),
    };
  }

  private calculateDiscountedValue(
    value: number,
    years: number,
    discountRate: number
  ): number {
    return value / Math.pow(1 + discountRate, years);
  }

  // Helper calculation methods
  private calculateDiseaseCostSavings(
    progression: any,
    multipliers: EconomicMultipliers["disease"]
  ): number {
    // Implementation of disease cost calculations
    return 0; // Placeholder
  }

  private calculateMortalityRelatedSavings(
    mortality: any,
    multipliers: EconomicMultipliers["healthcare"]
  ): number {
    // Implementation of mortality-related savings
    return 0; // Placeholder
  }

  private calculateHospitalizationSavings(
    hospitalizations: any,
    multipliers: EconomicMultipliers["healthcare"]
  ): number {
    // Implementation of hospitalization savings
    return 0; // Placeholder
  }

  private calculateMedicationSavings(
    medication: any,
    multipliers: EconomicMultipliers["healthcare"]
  ): number {
    // Implementation of medication savings
    return 0; // Placeholder
  }

  private calculateMobilityProductivityGain(
    mobility: any,
    multipliers: EconomicMultipliers["productivity"]
  ): number {
    // Implementation of mobility-related productivity gains
    return 0; // Placeholder
  }

  private calculateIndependenceEffect(
    independence: any,
    multipliers: EconomicMultipliers["productivity"]
  ): number {
    // Implementation of independence effect on productivity
    return 0; // Placeholder
  }

  private calculateIQProductivityGain(
    iq: any,
    multipliers: EconomicMultipliers["productivity"]
  ): number {
    // Implementation of IQ-related productivity gains
    return 0; // Placeholder
  }

  private calculateIQEducationEffect(
    iq: any,
    multipliers: EconomicMultipliers
  ): number {
    // Implementation of IQ effect on education
    return 0; // Placeholder
  }

  private calculateDisparitiesEffect(
    disparities: any,
    multipliers: EconomicMultipliers
  ): number {
    // Implementation of health disparities effect
    return 0; // Placeholder
  }
} 